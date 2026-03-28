import base64
import logging
import time
import uuid
from pathlib import Path

import requests as http_requests
from django.conf import settings
from django.core.files.base import ContentFile

from apps.products.models import Product
from .models import TryOnRequest

logger = logging.getLogger(__name__)

IDM_VTON_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985"
REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"

# Priority order: upper body first (shirt/jacket), then lower body (pants/skirt), then dresses
CATEGORY_MAP = {
    # Russian category names → IDM-VTON category
    "верхняя одежда": "upper_body",
    "куртки": "upper_body",
    "куртка": "upper_body",
    "пальто": "upper_body",
    "жакеты": "upper_body",
    "жакет": "upper_body",
    "толстовки": "upper_body",
    "толстовка": "upper_body",
    "свитеры": "upper_body",
    "свитер": "upper_body",
    "худи": "upper_body",
    "футболки": "upper_body",
    "футболка": "upper_body",
    "рубашки": "upper_body",
    "рубашка": "upper_body",
    "блузки": "upper_body",
    "блузка": "upper_body",
    "топы": "upper_body",
    "топ": "upper_body",
    "майки": "upper_body",
    "майка": "upper_body",
    "джемперы": "upper_body",
    "джемпер": "upper_body",
    "кофты": "upper_body",
    "кофта": "upper_body",
    "брюки": "lower_body",
    "штаны": "lower_body",
    "джинсы": "lower_body",
    "шорты": "lower_body",
    "юбки": "lower_body",
    "юбка": "lower_body",
    "леггинсы": "lower_body",
    "брюки карго": "lower_body",
    "платья": "dresses",
    "платье": "dresses",
    "комбинезоны": "dresses",
    "комбинезон": "dresses",
    "сарафаны": "dresses",
    "сарафан": "dresses",
    "костюмы": "upper_body",
    "пиджаки": "upper_body",
    "пиджак": "upper_body",
}

# Apply order: upper_body first, then lower_body, then dresses
CATEGORY_ORDER = {"upper_body": 0, "lower_body": 1, "dresses": 2}


class TryOnService:
    def __init__(self):
        self.token = settings.REPLICATE_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Prefer": "wait",
        }

    def _get_product_items(self, product_ids):
        products = Product.objects.filter(
            id__in=product_ids, is_active=True
        ).select_related('category').prefetch_related('images')

        product_map = {p.id: p for p in products}
        items = []
        for pid in product_ids:
            product = product_map.get(pid)
            if not product:
                continue
            # For try-on, prefer the second (non-main) image — typically a flat-lay/isolated garment
            # which works much better with IDM-VTON than lifestyle/model shots
            all_images = list(product.images.all())
            if len(all_images) >= 2:
                # Pick the first non-main image (second photo)
                tryon_image = None
                for img in all_images:
                    if not img.is_main:
                        tryon_image = img
                        break
                if not tryon_image:
                    tryon_image = all_images[1]  # fallback: just take the second one
            elif all_images:
                tryon_image = all_images[0]
            else:
                continue
            items.append({'product': product, 'image': tryon_image})

        # Sort: upper_body → lower_body → dresses for best sequential results
        items.sort(key=lambda x: CATEGORY_ORDER.get(self._get_vton_category(x), 1))
        return items

    def _get_vton_category(self, item: dict) -> str:
        product = item['product']
        if product.category:
            cat_name = product.category.name.lower().strip()
            if cat_name in CATEGORY_MAP:
                return CATEGORY_MAP[cat_name]
            # Partial match fallback
            for key, val in CATEGORY_MAP.items():
                if key in cat_name or cat_name in key:
                    return val
        return "upper_body"  # safe default

    def _image_field_to_data_uri(self, image_field) -> str:
        image_field.open('rb')
        data = image_field.read()
        image_field.close()
        ext = Path(image_field.name).suffix.lower()
        mime_map = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
        mime = mime_map.get(ext, 'image/jpeg')
        b64 = base64.b64encode(data).decode()
        return f"data:{mime};base64,{b64}"

    def _bytes_to_data_uri(self, data: bytes, mime: str = 'image/jpeg') -> str:
        b64 = base64.b64encode(data).decode()
        return f"data:{mime};base64,{b64}"

    def _run_vton(self, human_data_uri: str, garment_data_uri: str, garment_desc: str, category: str) -> bytes:
        logger.info(f"IDM-VTON: applying '{garment_desc}' [category={category}]")

        payload = {
            "version": IDM_VTON_VERSION,
            "input": {
                "human_img": human_data_uri,
                "garm_img": garment_data_uri,
                "garment_des": garment_desc,
                "category": category,
                "crop": True,       # auto-crop to 3:4 if needed
                "steps": 40,        # more steps = sharper/better quality
                "seed": 42,
            }
        }

        resp = http_requests.post(
            REPLICATE_API_URL,
            json=payload,
            headers=self.headers,
            timeout=180,
        )
        resp.raise_for_status()
        result = resp.json()

        prediction_id = result.get('id')
        output = result.get('output')
        status = result.get('status', '')

        if not output and status not in ('succeeded', 'failed', 'canceled'):
            output, status = self._poll_prediction(prediction_id)

        if status == 'failed' or not output:
            error = result.get('error') or 'IDM-VTON: нет результата'
            raise ValueError(f"IDM-VTON failed [{category}]: {error}")

        output_url = output[0] if isinstance(output, list) else str(output)

        image_resp = http_requests.get(output_url, timeout=60)
        image_resp.raise_for_status()
        logger.info(f"IDM-VTON: done '{garment_desc}', {len(image_resp.content)} bytes")
        return image_resp.content

    def _poll_prediction(self, prediction_id: str, timeout: int = 300):
        poll_url = f"{REPLICATE_API_URL}/{prediction_id}"
        poll_headers = {"Authorization": f"Bearer {self.token}"}
        deadline = time.time() + timeout

        while time.time() < deadline:
            time.sleep(3)
            resp = http_requests.get(poll_url, headers=poll_headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            status = data.get('status', '')
            if status == 'succeeded':
                return data.get('output'), status
            if status in ('failed', 'canceled'):
                return None, status
        raise TimeoutError(f"IDM-VTON: timeout ({timeout}s)")

    def _build_garment_description(self, item: dict) -> str:
        product = item['product']
        category = product.category.name if product.category else "garment"
        # Keep description concise and in English/mixed for better model comprehension
        return f"{product.brand} {product.name} ({category})"

    def process_tryon(self, tryon_request: TryOnRequest):
        tryon_request.status = 'processing'
        tryon_request.save(update_fields=['status'])

        try:
            items = self._get_product_items(tryon_request.product_ids)
            if not items:
                raise ValueError("Не найдены изображения товаров.")

            descriptions = [f"{self._build_garment_description(i)} [{self._get_vton_category(i)}]" for i in items]
            tryon_request.prompt_used = "IDM-VTON sequential: " + " → ".join(descriptions)
            tryon_request.save(update_fields=['prompt_used'])

            current_human_uri = self._image_field_to_data_uri(tryon_request.user_photo)

            for idx, item in enumerate(items):
                garment_uri = self._image_field_to_data_uri(item['image'].image)
                garment_desc = self._build_garment_description(item)
                vton_category = self._get_vton_category(item)

                result_data = self._run_vton(
                    current_human_uri,
                    garment_uri,
                    garment_desc,
                    vton_category,
                )

                current_human_uri = self._bytes_to_data_uri(result_data, 'image/jpeg')

                if idx < len(items) - 1:
                    time.sleep(1)

            # Decode final result
            final_b64 = current_human_uri.split(',', 1)[1]
            final_data = base64.b64decode(final_b64)

            filename = f"tryon_result_{uuid.uuid4().hex[:12]}.jpg"
            tryon_request.result_image.save(
                filename,
                ContentFile(final_data),
                save=False
            )
            tryon_request.status = 'done'
            tryon_request.save(update_fields=['status', 'result_image'])

        except Exception as e:
            logger.error(f"TryOn Error: {e}", exc_info=True)
            tryon_request.status = 'failed'
            tryon_request.error_message = str(e)
            tryon_request.save(update_fields=['status', 'error_message'])

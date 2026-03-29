import base64
import json
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

# ── IDM-VTON constants ─────────────────────────────────────────
IDM_VTON_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985"
REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"

# ── Kie AI constants ───────────────────────────────────────────
KIE_API_BASE = "https://api.kie.ai"
KIE_CREATE_TASK_URL = f"{KIE_API_BASE}/api/v1/jobs/createTask"
KIE_TASK_STATUS_URL = f"{KIE_API_BASE}/api/v1/jobs/recordInfo"
# File upload uses a DIFFERENT host!
KIE_FILE_UPLOAD_BASE = "https://kieai.redpandaai.co"
KIE_FILE_UPLOAD_URL = f"{KIE_FILE_UPLOAD_BASE}/api/file-base64-upload"

# ── Category keywords (shared) ─────────────────────────────────
LOWER_BODY_KEYWORDS = [
    "брюки", "штаны", "джинсы", "шорты", "юбка", "юбки",
    "леггинсы", "карго", "чиносы", "слаксы",
    "pants", "jeans", "shorts", "skirt", "trousers", "leggings",
]
DRESSES_KEYWORDS = [
    "платье", "платья", "комбинезон", "комбинезоны", "сарафан", "сарафаны",
    "dress", "jumpsuit", "overall", "romper",
]

CATEGORY_ORDER = {"lower_body": 0, "upper_body": 1, "dresses": 2}


# ══════════════════════════════════════════════════════════════
#  Base service with shared helpers
# ══════════════════════════════════════════════════════════════

class BaseTryOnService:
    """Shared logic for all try-on providers."""

    # ── Product fetching ──────────────────────────────────────

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
            # Prefer the second (non-main) image — flat-lay/isolated garment works best
            all_images = list(product.images.all())
            if len(all_images) >= 2:
                tryon_image = None
                for img in all_images:
                    if not img.is_main:
                        tryon_image = img
                        break
                if not tryon_image:
                    tryon_image = all_images[1]
            elif all_images:
                tryon_image = all_images[0]
            else:
                continue
            items.append({'product': product, 'image': tryon_image})

        # Sort: lower_body → upper_body → dresses
        items.sort(key=lambda x: CATEGORY_ORDER.get(self._get_category(x), 1))
        return items

    # ── Category detection ────────────────────────────────────

    def _get_category(self, item: dict) -> str:
        product = item['product']
        if not product.category:
            return "upper_body"
        cat_name = product.category.name.lower().strip()
        for kw in LOWER_BODY_KEYWORDS:
            if kw in cat_name:
                return "lower_body"
        for kw in DRESSES_KEYWORDS:
            if kw in cat_name:
                return "dresses"
        return "upper_body"

    # ── Image helpers ─────────────────────────────────────────

    def _image_field_to_data_uri(self, image_field) -> str:
        image_field.open('rb')
        data = image_field.read()
        image_field.close()
        ext = Path(image_field.name).suffix.lower()
        mime_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.webp': 'image/webp',
        }
        mime = mime_map.get(ext, 'image/jpeg')
        b64 = base64.b64encode(data).decode()
        return f"data:{mime};base64,{b64}"

    def _image_field_to_bytes(self, image_field) -> bytes:
        image_field.open('rb')
        data = image_field.read()
        image_field.close()
        return data

    def _bytes_to_data_uri(self, data: bytes, mime: str = 'image/jpeg') -> str:
        b64 = base64.b64encode(data).decode()
        return f"data:{mime};base64,{b64}"

    # ── Garment description (English) ─────────────────────────

    def _build_garment_description(self, item: dict) -> str:
        product = item['product']
        category = product.category.name if product.category else "garment"
        return f"{product.brand} {product.name}, {category}"

    # ── Main processing pipeline (shared) ─────────────────────

    def process_tryon(self, tryon_request: TryOnRequest):
        tryon_request.status = 'processing'
        tryon_request.save(update_fields=['status'])

        try:
            items = self._get_product_items(tryon_request.product_ids)
            if not items:
                raise ValueError("Не найдены изображения товаров.")

            descriptions = [
                f"{self._build_garment_description(i)} [{self._get_category(i)}]"
                for i in items
            ]
            provider_name = self.__class__.__name__
            tryon_request.prompt_used = f"{provider_name}: " + " → ".join(descriptions)
            tryon_request.save(update_fields=['prompt_used'])

            # Start with user's photo
            current_human_img = self._image_field_to_data_uri(tryon_request.user_photo)
            result_bytes: bytes = b''

            for idx, item in enumerate(items):
                garment_img = self._image_field_to_data_uri(item['image'].image)
                garment_des = self._build_garment_description(item)
                category = self._get_category(item)

                result_bytes = self._run_vton(
                    current_human_img,
                    garment_img,
                    garment_des,
                    category,
                )

                # Next step uses this result as the new human image
                current_human_img = self._bytes_to_data_uri(result_bytes, 'image/jpeg')

                if idx < len(items) - 1:
                    time.sleep(1)

            # Save final result
            filename = f"tryon_result_{uuid.uuid4().hex[:12]}.jpg"
            tryon_request.result_image.save(
                filename,
                ContentFile(result_bytes),
                save=False,
            )
            tryon_request.status = 'done'
            tryon_request.save(update_fields=['status', 'result_image'])

        except Exception as e:
            logger.error(f"TryOn Error ({self.__class__.__name__}): {e}", exc_info=True)
            tryon_request.status = 'failed'
            tryon_request.error_message = str(e)
            tryon_request.save(update_fields=['status', 'error_message'])

    def _run_vton(self, human_img: str, garm_img: str, garment_des: str, category: str) -> bytes:
        raise NotImplementedError


# ══════════════════════════════════════════════════════════════
#  Replicate IDM-VTON provider
# ══════════════════════════════════════════════════════════════

class ReplicateTryOnService(BaseTryOnService):
    """Virtual try-on via Replicate cuuupid/idm-vton."""

    def __init__(self):
        self.token = settings.REPLICATE_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Prefer": "wait",
        }

    def _run_vton(self, human_img: str, garm_img: str, garment_des: str, category: str) -> bytes:
        logger.info(f"IDM-VTON: applying '{garment_des}' [category={category}]")

        payload = {
            "version": IDM_VTON_VERSION,
            "input": {
                "human_img": human_img,
                "garm_img": garm_img,
                "garment_des": garment_des,
                "category": category,
                "crop": True,
                "steps": 30,
                "seed": 42,
                "force_dc": False,
                "mask_only": False,
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
            output, status, error = self._poll_replicate(prediction_id)
        else:
            error = result.get('error')

        if status == 'failed':
            raise ValueError(f"IDM-VTON failed [{category}]: {error or 'Unknown error'}")
        if not output:
            raise ValueError(f"IDM-VTON returned no output [{category}]")

        output_url = output[0] if isinstance(output, list) else str(output)
        image_resp = http_requests.get(output_url, timeout=60)
        image_resp.raise_for_status()
        logger.info(f"IDM-VTON: done '{garment_des}', result={len(image_resp.content)} bytes")
        return image_resp.content

    def _poll_replicate(self, prediction_id: str, timeout: int = 300):
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
                return data.get('output'), status, None
            if status in ('failed', 'canceled'):
                return None, status, data.get('error')
        raise TimeoutError(f"IDM-VTON: polling timeout ({timeout}s)")


# ══════════════════════════════════════════════════════════════
#  Kie AI (Nano Banana 2) provider
# ══════════════════════════════════════════════════════════════

class KieTryOnService(BaseTryOnService):
    """
    Virtual try-on via Kie AI Market API using Nano Banana 2 (image editing model).

    Sends ALL clothing items + person photo in a SINGLE request.
    """

    def __init__(self):
        self.token = settings.KIE_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    # ── File upload (base64 → URL) ────────────────────────────

    def _upload_image(self, data_uri: str, filename: str = None) -> str:
        if not filename:
            filename = f"tryon_{uuid.uuid4().hex[:8]}.jpg"

        payload = {
            "base64Data": data_uri,
            "uploadPath": "tryon-images",
            "fileName": filename,
        }

        resp = http_requests.post(
            KIE_FILE_UPLOAD_URL,
            json=payload,
            headers=self.headers,
            timeout=60,
        )
        resp.raise_for_status()
        result = resp.json()

        if result.get('code') != 200 and not result.get('success'):
            raise ValueError(f"Kie file upload failed: {result.get('msg', 'Unknown error')}")

        download_url = result.get('data', {}).get('downloadUrl')
        if not download_url:
            raise ValueError("Kie file upload returned no downloadUrl")

        logger.info(f"Kie: uploaded {filename} → {download_url}")
        return download_url

    # ── Build combined try-on prompt ──────────────────────────

    def _build_combined_prompt(self, items: list) -> str:
        items_description = []
        for idx, item in enumerate(items):
            product = item['product']
            category = self._get_category(item)
            cat_name = product.category.name if product.category else "garment"

            category_desc = {
                "upper_body": "верхняя часть тела (рубашка, футболка, куртка, свитер, худи, пальто)",
                "lower_body": "нижняя часть тела (брюки, джинсы, шорты, юбка)",
                "dresses": "цельная одежда (платье, комбинезон, сарафан)",
            }
            cat_text = category_desc.get(category, "одежда")

            items_description.append(
                f"  - Image {idx + 2}: \"{product.brand} {product.name}\" — "
                f"категория: {cat_name} ({cat_text}). "
                f"IMPORTANT: Even if this image shows a model wearing multiple items, "
                f"extract and use ONLY the \"{product.name}\" ({cat_text}) from this image. "
                f"Ignore any other clothing or accessories visible on the model in this reference photo."
            )

        items_list = "\n".join(items_description)

        return (
            "STRICT VIRTUAL TRY-ON INSTRUCTION.\n\n"
            "You are given a photo of a person (Image 1) and reference photos of specific clothing items "
            f"(Images 2 through {len(items) + 1}).\n\n"
            "TASK: Generate a single photorealistic image of the SAME person from Image 1 "
            "wearing ALL of the specified clothing items simultaneously.\n\n"
            "MANDATORY RULES — DO NOT VIOLATE ANY OF THESE:\n"
            "1. FACE & IDENTITY: The person's face, hairstyle, skin tone, and ALL facial features "
            "MUST remain 100% identical to Image 1. Zero alterations.\n"
            "2. BODY & POSE: The person's body proportions, pose, stance, hand positions, and posture "
            "MUST be preserved exactly as in Image 1.\n"
            "3. BACKGROUND: The background, environment, floor, walls, and ALL surroundings "
            "MUST remain completely unchanged from Image 1.\n"
            "4. CLOTHING EXTRACTION: Each reference image may show a model wearing the garment. "
            "You must identify and extract ONLY the specific garment named in the description below. "
            "Ignore all other clothing, shoes, and accessories visible on the reference model.\n"
            "5. CLOTHING ACCURACY: Each clothing item must precisely match the color, pattern, "
            "texture, fabric weave, cut, silhouette, and design details of the corresponding reference image.\n"
            "6. NATURAL FIT: The clothing must appear naturally worn on the person's body — "
            "with realistic fabric drape, natural folds, proper shadows, wrinkles consistent with the pose, "
            "and anatomically correct fit.\n"
            "7. LIGHTING CONSISTENCY: Maintain the exact same lighting direction, intensity, shadows, "
            "and color temperature as in Image 1.\n"
            "8. NO ADDITIONS: Do not add any accessories, jewelry, shoes, bags, hats, or any items "
            "not explicitly listed below.\n"
            "9. PHOTOREALISM: The output must be indistinguishable from a real photograph. "
            "No artistic filters, no cartoon effects, no visible AI artifacts.\n\n"
            f"CLOTHING ITEMS TO APPLY:\n{items_list}\n\n"
            "OUTPUT: A single photorealistic image of the person from Image 1 wearing all listed clothing items. "
            "Preserve everything about the person except replace the relevant clothing zones."
        )

    # ── Create task ────────────────────────────────────────────

    def _create_task(self, image_urls: list, prompt: str) -> str:
        payload = {
            "model": "nano-banana-2",
            "input": {
                "prompt": prompt,
                "image_input": image_urls,
                "aspect_ratio": "3:4",
                "resolution": "1K",
                "output_format": "jpg",
            }
        }

        resp = http_requests.post(
            KIE_CREATE_TASK_URL,
            json=payload,
            headers=self.headers,
            timeout=60,
        )
        resp.raise_for_status()
        result = resp.json()

        if result.get('code') != 200:
            raise ValueError(
                f"Kie createTask failed: code={result.get('code')}, msg={result.get('msg')}"
            )

        task_id = result.get('data', {}).get('taskId')
        if not task_id:
            raise ValueError("Kie createTask returned no taskId")

        logger.info(f"Kie: created task {task_id}")
        return task_id

    # ── Poll for result ────────────────────────────────────────

    def _poll_result(self, task_id: str, timeout: int = 600) -> str:
        deadline = time.time() + timeout
        poll_interval = 3

        while time.time() < deadline:
            time.sleep(poll_interval)

            resp = http_requests.get(
                KIE_TASK_STATUS_URL,
                params={"taskId": task_id},
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()

            if result.get('code') != 200:
                logger.warning(f"Kie poll non-200: {result}")
                continue

            data = result.get('data', {})
            state = data.get('state', '')

            logger.debug(f"Kie task {task_id}: state={state}")

            if state == 'success':
                result_json_str = data.get('resultJson', '{}')
                try:
                    result_json = json.loads(result_json_str)
                except (json.JSONDecodeError, TypeError):
                    result_json = {}

                result_urls = result_json.get('resultUrls', [])
                if not result_urls:
                    raise ValueError(f"Kie task {task_id} succeeded but no resultUrls")

                logger.info(f"Kie task {task_id}: success, url={result_urls[0]}")
                return result_urls[0]

            if state == 'fail':
                fail_msg = data.get('failMsg', 'Unknown error')
                fail_code = data.get('failCode', '')
                raise ValueError(f"Kie task {task_id} failed: [{fail_code}] {fail_msg}")

            poll_interval = min(poll_interval + 1, 10)

        raise TimeoutError(f"Kie task {task_id}: polling timeout ({timeout}s)")

    # ── Override process_tryon: single request for all items ──

    def process_tryon(self, tryon_request: TryOnRequest):
        tryon_request.status = 'processing'
        tryon_request.save(update_fields=['status'])

        try:
            items = self._get_product_items(tryon_request.product_ids)
            if not items:
                raise ValueError("Не найдены изображения товаров.")

            descriptions = [
                f"{self._build_garment_description(i)} [{self._get_category(i)}]"
                for i in items
            ]
            tryon_request.prompt_used = f"KieTryOnService (single-request): " + " + ".join(descriptions)
            tryon_request.save(update_fields=['prompt_used'])

            human_data_uri = self._image_field_to_data_uri(tryon_request.user_photo)
            human_url = self._upload_image(human_data_uri, f"human_{uuid.uuid4().hex[:8]}.jpg")
            logger.info(f"Kie: uploaded human photo")

            image_urls = [human_url]

            for idx, item in enumerate(items):
                garment_data_uri = self._image_field_to_data_uri(item['image'].image)
                garment_url = self._upload_image(
                    garment_data_uri,
                    f"garment_{idx}_{uuid.uuid4().hex[:8]}.jpg"
                )
                image_urls.append(garment_url)
                logger.info(f"Kie: uploaded garment {idx}: {item['product'].name}")

            prompt = self._build_combined_prompt(items)
            logger.info(f"Kie: creating single task with {len(image_urls)} images")

            task_id = self._create_task(image_urls, prompt)

            result_url = self._poll_result(task_id)

            image_resp = http_requests.get(result_url, timeout=60)
            image_resp.raise_for_status()

            filename = f"tryon_result_{uuid.uuid4().hex[:12]}.jpg"
            tryon_request.result_image.save(
                filename,
                ContentFile(image_resp.content),
                save=False,
            )
            tryon_request.status = 'done'
            tryon_request.save(update_fields=['status', 'result_image'])

            logger.info(f"Kie: try-on complete, result={len(image_resp.content)} bytes")

        except Exception as e:
            logger.error(f"TryOn Error (KieTryOnService): {e}", exc_info=True)
            tryon_request.status = 'failed'
            tryon_request.error_message = str(e)
            tryon_request.save(update_fields=['status', 'error_message'])

    def _run_vton(self, human_img: str, garm_img: str, garment_des: str, category: str) -> bytes:
        raise NotImplementedError("KieTryOnService uses process_tryon() directly, not _run_vton()")


# ══════════════════════════════════════════════════════════════
#  Factory + backward-compatible alias
# ══════════════════════════════════════════════════════════════

def get_tryon_service() -> BaseTryOnService:
    """
    Factory: create the appropriate try-on service based on TRYON_PROVIDER setting.
    Returns ReplicateTryOnService or KieTryOnService.
    """
    provider = getattr(settings, 'TRYON_PROVIDER', 'replicate').lower().strip()

    if provider == 'kie':
        logger.info("TryOn provider: Kie AI (Nano Banana 2)")
        return KieTryOnService()
    else:
        logger.info("TryOn provider: Replicate (IDM-VTON)")
        return ReplicateTryOnService()


# Backward-compatible alias — views.py imports TryOnService
TryOnService = type('TryOnService', (), {
    '__new__': lambda cls: get_tryon_service(),
})


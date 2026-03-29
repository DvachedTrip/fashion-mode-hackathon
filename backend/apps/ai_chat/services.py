import json
import logging
import google.generativeai as genai
from django.conf import settings
from apps.products.models import Product
from .models import ChatSession, ChatMessage
from .dataclasses import GeminiChatResponse

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

class ProductContextBuilder:
    @staticmethod
    def get_catalog_json():
        products = Product.objects.filter(is_active=True).select_related('category', 'color').prefetch_related('tags')
        catalog = []
        for p in products:
            catalog.append({
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": float(p.price),
                "category": p.category.name if p.category else None,
                "color": p.color.name if p.color else None,
                "tags": [t.name for t in p.tags.all()],
            })
        return json.dumps(catalog, ensure_ascii=False)

class GeminiChatService:
    def __init__(self):
        # Используем доступную для данного ключа модель
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=self._get_system_prompt()
        )
    
    def _get_system_prompt(self):
        catalog_json = ProductContextBuilder.get_catalog_json()
        return f"""Ты — стилист и модный ассистент интернет-магазина одежды.

Тебе доступен каталог товаров в формате JSON.
Когда пользователь просит подобрать образ или вещь:
1. Выбери из каталога самые подходящие товары.
2. Дай очень КОРОТКИЙ и ЛАКОНИЧНЫЙ совет по стилю (1-3 предложения). Общайся тепло.
3. ВАЖНО: НИКОГДА не перечисляй названия выбранных товаров, их бренды или ID в самом тексте ответа. Пользователь сам увидит их в виде карточек под твоим сообщением! Просто дай общий совет, с чем это носить.

ОБЯЗАТЕЛЬНО возвращай ответ ТОЛЬКО в формате чистого JSON без лишнего текста (без символов ```json).
{{
  "message": "<Твой краткий совет стилиста на русском языке без упоминания названий и ID товаров>",
  "product_ids": [<id_1>, <id_2>]
}}

Каталог товаров:
{catalog_json}
"""

    def process_message(self, session: ChatSession, user_text: str) -> ChatMessage:
        # Сохраняем сообщение юзера
        ChatMessage.objects.create(session=session, role='user', text=user_text)
        
        # Получаем историю 
        history = ChatMessage.objects.filter(session=session).order_by('created_at')[:20]
        
        # Строим contents с правильным чередованием user/model
        contents = []
        last_role = None
        
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            
            # Merge consecutive same-role messages to avoid alternation violations
            if role == last_role and contents:
                contents[-1]["parts"].append(msg.text)
            else:
                contents.append({
                    "role": role, 
                    "parts": [msg.text]
                })
                last_role = role
            
        try:
            response = self.model.generate_content(
                contents,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            message = data.get("message", "Извините, я не смог подобрать товары.")
            product_ids = data.get("product_ids", [])
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            message = "Произошла ошибка при анализе ответа от ИИ. Пожалуйста, попробуйте еще раз."
            product_ids = []
            
        # Удаляем невалидные или придуманные ИИ IDшники (галлюцинации)
        valid_ids_set = set(Product.objects.filter(id__in=product_ids).values_list('id', flat=True))
        valid_product_ids = [pid for pid in product_ids if pid in valid_ids_set]
        
        # Сохраняем и отдаем сообщение ассистента 
        assistant_msg = ChatMessage.objects.create(
            session=session,
            role='assistant',
            text=message,
            product_ids=valid_product_ids
        )
        
        return assistant_msg

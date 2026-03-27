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
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def get_system_prompt(self):
        catalog_json = ProductContextBuilder.get_catalog_json()
        return f"""Ты — первоклассный стилист и модный ассистент интернет-магазина одежды.
Твоя задача — помогать покупателям собирать потрясающие образы, давать глубокие советы по стилю (что с чем сочетать, актуальные тренды) и предлагать конкретные вещи из нашего каталога.

Тебе доступен каталог товаров в формате JSON. Каждый товар содержит: id, name, brand, price, category, color, tags (стиль, сезон, крой и т.д.).

Когда пользователь описывает желаемый образ, вещь или просто просит совет:
1. Выбери из каталога самые подходящие товары.
2. Дай развернутый совет стилиста в поле message: как их носить, с чем сочетать (даже если эти вещи есть или нет в магазине). Общайся тепло и экспертно.
3. Если просят собрать полный образ, подбери несколько вещей, чтобы они сочетались друг с другом по цвету, стилю и сезону.
4. Если просят одну вещь - предложи лучшие варианты на выбор.

ОБЯЗАТЕЛЬНО возвращай ответ ТОЛЬКО в формате чистого JSON без лишнего текста или маркдауна (без символов ```json). Твой ответ должен строго соответствовать этой структуре:
{{
  "message": "<Твой развернутый ответ, советы стилиста на русском языке>",
  "product_ids": [<id_1>, <id_2>]
}}

Каталог товаров:
{catalog_json}
"""

    def process_message(self, session: ChatSession, user_text: str) -> ChatMessage:
        # Сохраняем сообщение юзера
        ChatMessage.objects.create(session=session, role='user', text=user_text)
        
        # Получаем историю 
        history = ChatMessage.objects.filter(session=session).order_by('created_at')[:10]
        
        # Готовим вызов
        system_prompt = self.get_system_prompt()
        contents = [{"role": "user", "parts": [system_prompt]}]
        
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append({
                "role": role, 
                "parts": [msg.text]
            })
            
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

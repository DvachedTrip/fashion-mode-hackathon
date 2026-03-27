import os
import django
from django.utils.text import slugify

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Tag

TAGS_TO_CREATE = [
    # Стиль
    "casual", "оверсайз", "деловой", "спортивный", "вечерний", 
    "базовый", "винтаж", "минимализм", "гранж",
    
    # Сезон
    "лето", "зима", "демисезон", "всесезонный", "осень", "весна",
    
    # Материал
    "хлопок", "лен", "кожа", "экокожа", "деним", "шерсть", "кашемир", 
    "синтетика", "шелк", "трикотаж", "флис", "вельвет",
    
    # Назначение
    "на каждый день", "в офис", "для тренировок", "на праздник", "для дома", "на свидание",
    
    # Паттерн / принт
    "однотонный", "в полоску", "в клетку", "с принтом", "в горошек",
    
    # Длина / Крой
    "укороченный", "удлиненный", "приталенный", "свободный крой", "прямой крой"
]

print("Начинаю генерацию тегов...")

created_count = 0
for tag_name in TAGS_TO_CREATE:
    # Генерируем slug (разрешаем юникод для русских символов)
    slug = slugify(tag_name, allow_unicode=True)
    
    # Создаем или получаем тег
    tag, created = Tag.objects.get_or_create(
        name=tag_name,
        defaults={'slug': slug}
    )
    if created:
        created_count += 1
        print(f"  + Создан тег: {tag_name}")
    else:
        print(f"  - Тег уже существует: {tag_name}")

print(f"Успешно создано {created_count} новых тегов!")

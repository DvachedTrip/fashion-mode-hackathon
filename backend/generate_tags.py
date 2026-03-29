import os
import django
from django.utils.text import slugify
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.products.models import Tag
TAGS_TO_CREATE = [
    "casual", "оверсайз", "деловой", "спортивный", "вечерний", 
    "базовый", "винтаж", "минимализм", "гранж",
    "лето", "зима", "демисезон", "всесезонный", "осень", "весна",
    "хлопок", "лен", "кожа", "экокожа", "деним", "шерсть", "кашемир", 
    "синтетика", "шелк", "трикотаж", "флис", "вельвет",
    "на каждый день", "в офис", "для тренировок", "на праздник", "для дома", "на свидание",
    "однотонный", "в полоску", "в клетку", "с принтом", "в горошек",
    "укороченный", "удлиненный", "приталенный", "свободный крой", "прямой крой"
]
print("Начинаю генерацию тегов...")
created_count = 0
for tag_name in TAGS_TO_CREATE:
    slug = slugify(tag_name, allow_unicode=True)
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
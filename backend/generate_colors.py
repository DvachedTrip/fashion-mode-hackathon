import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.products.models import Color
COLORS_TO_CREATE = [
    ("Черный", "#000000"),
    ("Белый", "#FFFFFF"),
    ("Серый", "#808080"),
    ("Красный", "#FF0000"),
    ("Синий", "#0000FF"),
    ("Зеленый", "#008000"),
    ("Желтый", "#FFFF00"),
    ("Коричневый", "#964B00"),
    ("Бежевый", "#F5F5DC"),
    ("Розовый", "#FFC0CB"),
    ("Голубой", "#ADD8E6"),
    ("Бордовый", "#800000"),
    ("Фиолетовый", "#800080"),
    ("Оранжевый", "#FFA500")
]
print("Генерация цветов...")
created_count = 0
for color_name, hex_code in COLORS_TO_CREATE:
    color, created = Color.objects.get_or_create(
        name=color_name,
        defaults={'hex_code': hex_code}
    )
    if created:
        created_count += 1
        print(f"  + Создан цвет: {color_name} ({hex_code})")
    else:
        print(f"  - Цвет уже есть: {color_name}")
print(f"Успешно создано {created_count} новых цветов!")
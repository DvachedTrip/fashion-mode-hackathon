import os
import django
import random
from io import BytesIO
from PIL import Image, ImageDraw
from django.core.files.base import ContentFile
from django.utils.text import slugify
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.products.models import Category, Tag, Color, Product, ProductImage, ProductSize, ProductTag
cats = ["Верхняя одежда", "Свитера и худи", "Футболки", "Джинсы", "Брюки", "Платья", "Обувь", "Аксессуары"]
cat_objs = []
for c in cats:
    obj, _ = Category.objects.get_or_create(name=c, defaults={'slug': slugify(c, allow_unicode=True)})
    cat_objs.append(obj)
products_data = [
    ("Оверсайз худи 'Minimal'", 4500.00, "Свитера и худи", "Бежевый", ["оверсайз", "базовый", "на каждый день", "хлопок"]),
    ("Утепленная куртка-пуховик", 12500.00, "Верхняя одежда", "Черный", ["зима", "спортивный", "на каждый день"]),
    ("Джинсы Straight Fit", 5200.00, "Джинсы", "Синий", ["деним", "базовый", "casual"]),
    ("Базовая футболка", 1500.00, "Футболки", "Белый", ["лето", "базовый", "хлопок"]),
    ("Кожаная куртка Biker", 15000.00, "Верхняя одежда", "Черный", ["кожа", "гранж", "демисезон"]),
    ("Классические брюки", 4800.00, "Брюки", "Серый", ["деловой", "в офис", "минимализм"]),
    ("Льняное платье", 6500.00, "Платья", "Белый", ["лето", "лен", "на свидание"]),
    ("Кроссовки StreetRun", 8900.00, "Обувь", "Белый", ["спортивный", "для тренировок", "всесезонный"]),
    ("Вязаный свитер с горлом", 5500.00, "Свитера и худи", "Бордовый", ["зима", "шерсть", "винтаж"]),
    ("Джинсовая куртка", 6200.00, "Верхняя одежда", "Синий", ["деним", "лето", "casual"]),
    ("Футболка с принтом", 1800.00, "Футболки", "Черный", ["с принтом", "хлопок", "на каждый день"]),
    ("Брюки Карго", 5000.00, "Брюки", "Зеленый", ["спортивный", "хлопок", "свободный крой"]),
    ("Шерстяное пальто", 18000.00, "Верхняя одежда", "Бежевый", ["осень", "деловой", "шерсть", "удлиненный"]),
    ("Легкая куртка-ветровка", 4500.00, "Верхняя одежда", "Синий", ["весна", "синтетика", "спортивный"]),
    ("Кеды Canvas", 4200.00, "Обувь", "Черный", ["всесезонный", "casual", "на каждый день", "базовый"])
]
all_tags = {t.name.lower(): t for t in Tag.objects.all()}
all_colors = {c.name.lower(): c for c in Color.objects.all()}
sizes = ['S', 'M', 'L', 'XL']
print("Генерация товаров началась...")
for i, (name, price, cat_name, color_name, tag_names) in enumerate(products_data):
    cat = next(c for c in cat_objs if c.name == cat_name)
    color = all_colors.get(color_name.lower())
    p, created = Product.objects.get_or_create(
        name=name,
        defaults={
            'description': f"Прекрасный товар '{name}'. Отличный выбор для создания индивидуального и стильного образа.",
            'price': price,
            'category': cat,
            'brand': random.choice(["Nike", "Adidas", "Pull&Bear", "Zara", "LocalBrand", "Lacoste"]),
            'color': color,
            'is_active': True
        }
    )
    if created:
        print(f"[{i+1}/15] Успешно загружен: {name}")
        for tn in tag_names:
            tag_obj = all_tags.get(tn)
            if tag_obj:
                ProductTag.objects.get_or_create(product=p, tag=tag_obj)
        for s in random.sample(sizes, 3):
            ProductSize.objects.get_or_create(product=p, size=s, in_stock=True)
        hex_bg = color.hex_code if (color and color.hex_code) else '#888888'
        img = Image.new('RGB', (800, 800), color=hex_bg)
        d = ImageDraw.Draw(img)
        d.line((0, 0, 800, 800), fill=(255,255,255,128), width=5)
        d.line((0, 800, 800, 0), fill=(255,255,255,128), width=5)
        f = BytesIO()
        img.save(f, format='JPEG')
        file_name = f"{slugify(name, allow_unicode=True)}.jpg"
        img_obj = ProductImage(product=p, is_main=True)
        img_obj.image.save(file_name, ContentFile(f.getvalue()), save=True)
print("✅ Генерация тестовых данных товаров успешно завершена!")
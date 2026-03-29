import os
import sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.products.models import ProductSize, Size, Product
import random
ProductSize.objects.all().delete()
Size.objects.all().delete()
sizes_data = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size', '38', '40', '42', '44', '46']
size_objs = []
for s in sizes_data:
    obj, _ = Size.objects.get_or_create(name=s)
    size_objs.append(obj)
products = Product.objects.all()
for p in products:
    for s in random.sample(size_objs, k=random.randint(2, 4)):
        ProductSize.objects.create(product=p, size=s, in_stock=True)
print(f"Успешно создано {len(size_objs)} размеров и привязано к товарам!")
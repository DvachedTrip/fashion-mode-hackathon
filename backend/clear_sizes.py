import os
import sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.products.models import ProductSize
count, _ = ProductSize.objects.all().delete()
print(f"Deleted {count} ProductSize records.")
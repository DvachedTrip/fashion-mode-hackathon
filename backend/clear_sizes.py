import os
import sys

# Ensure we're in the backend directory context
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import ProductSize

# Clear all Product sizes to safely change DB schema to ForeignKey
count, _ = ProductSize.objects.all().delete()
print(f"Deleted {count} ProductSize records.")

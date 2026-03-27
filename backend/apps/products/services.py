from django.shortcuts import get_object_or_404
from .models import Product
from .filters import ProductFilter

class ProductFilterService:
    @staticmethod
    def get_filtered_products(request):
        queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')
        
        # Apply djang-filters
        product_filter = ProductFilter(request.GET, queryset=queryset)
        return product_filter.qs

class ProductDetailService:
    @staticmethod
    def get_product_detail(product_id: int):
        # Gather product with all related objects to prevent N+1 queries.
        queryset = Product.objects.filter(is_active=True).select_related('category', 'color').prefetch_related(
            'images', 'sizes'
        )
        return get_object_or_404(queryset, id=product_id)

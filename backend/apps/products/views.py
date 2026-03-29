from rest_framework import viewsets, generics
from rest_framework.response import Response
from .models import Category, Tag
from .serializers import (
    CategorySerializer, 
    TagSerializer, 
    ProductShortSerializer, 
    ProductDetailSerializer
)
from .services import ProductFilterService, ProductDetailService
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent__isnull=True).prefetch_related('children')
    serializer_class = CategorySerializer
    pagination_class = None
class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None
class ProductViewSet(viewsets.ViewSet):
    def list(self, request):
        queryset = ProductFilterService.get_filtered_products(request)
        paginator = self.get_paginator()
        if paginator:
            paginated_qs = paginator.paginate_queryset(queryset, request, view=self)
            serializer = ProductShortSerializer(paginated_qs, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        serializer = ProductShortSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    def retrieve(self, request, pk=None):
        product = ProductDetailService.get_product_detail(pk)
        serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(serializer.data)
    @property
    def paginator(self):
        if not hasattr(self, '_paginator'):
            from django.conf import settings
            from rest_framework.settings import api_settings
            paginator_class = api_settings.DEFAULT_PAGINATION_CLASS
            self._paginator = paginator_class() if paginator_class else None
        return self._paginator
    def get_paginator(self):
        return self.paginator
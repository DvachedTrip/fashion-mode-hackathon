from rest_framework import serializers
from .models import Category, Tag, Product, ProductImage, ProductSize

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'children']

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.all(), many=True).data
        return []

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_main']

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'in_stock']

class ProductShortSerializer(serializers.ModelSerializer):
    main_image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'brand', 'price', 'main_image_url', 'category_name']

    def get_main_image_url(self, obj):
        # We assume that the view/service has prefetched images 
        # to avoid N+1 queries.
        request = self.context.get('request')
        for image in obj.images.all():
            if image.is_main:
                if request is not None:
                    return request.build_absolute_uri(image.image.url)
                return image.image.url
        return None

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category', 'brand', 
            'is_active', 'created_at', 'images', 'sizes', 'tags'
        ]

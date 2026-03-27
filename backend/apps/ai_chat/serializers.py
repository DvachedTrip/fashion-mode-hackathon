from rest_framework import serializers
from apps.products.models import Product
from apps.products.serializers import ProductShortSerializer
from .models import ChatSession, ChatMessage

class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'session_key', 'created_at']

class ChatMessageInputSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=1000)

class ChatMessageSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'text', 'products', 'created_at']

    def get_products(self, obj):
        if not obj.product_ids:
            return []
        
        products = Product.objects.filter(id__in=obj.product_ids).select_related('category', 'color').prefetch_related('images')
        
        # Сохраняем исходный порядок выдачи ИИ
        product_map = {p.id: p for p in products}
        sorted_products = [product_map[pid] for pid in obj.product_ids if pid in product_map]
        
        serializer = ProductShortSerializer(sorted_products, many=True, context=self.context)
        return serializer.data

from rest_framework import serializers
from .models import TryOnRequest
class TryOnCreateSerializer(serializers.Serializer):
    session_key = serializers.CharField(max_length=255)
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=10
    )
    user_photo = serializers.ImageField()
    def validate_user_photo(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Размер файла не должен превышать 10 МБ.")
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError("Загрузите файл изображения.")
        return value
class TryOnResultSerializer(serializers.ModelSerializer):
    result_image_url = serializers.SerializerMethodField()
    class Meta:
        model = TryOnRequest
        fields = ['id', 'status', 'result_image_url', 'error_message', 'created_at']
    def get_result_image_url(self, obj):
        if obj.result_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.result_image.url)
            return obj.result_image.url
        return None
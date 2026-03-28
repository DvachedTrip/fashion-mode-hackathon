from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.shortcuts import get_object_or_404

from .models import TryOnRequest
from .serializers import TryOnCreateSerializer, TryOnResultSerializer
from .services import TryOnService


class TryOnCreateView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        data = request.data.copy()
        product_ids_raw = request.data.getlist('product_ids', [])
        if product_ids_raw:
            data.setlist('product_ids', product_ids_raw)

        serializer = TryOnCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        tryon_request = TryOnRequest.objects.create(
            session_key=serializer.validated_data['session_key'],
            product_ids=serializer.validated_data['product_ids'],
            user_photo=serializer.validated_data['user_photo'],
        )

        service = TryOnService()
        service.process_tryon(tryon_request)

        result_serializer = TryOnResultSerializer(
            tryon_request, context={'request': request}
        )
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class TryOnDetailView(APIView):
    def get(self, request, pk):
        tryon_request = get_object_or_404(TryOnRequest, pk=pk)
        serializer = TryOnResultSerializer(
            tryon_request, context={'request': request}
        )
        return Response(serializer.data)

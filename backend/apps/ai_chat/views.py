from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import ChatSession
from .serializers import (
    ChatSessionSerializer, 
    ChatMessageSerializer, 
    ChatMessageInputSerializer
)
from .services import GeminiChatService

class ChatSessionViewSet(viewsets.ViewSet):
    def create(self, request):
        session = ChatSession.objects.create()
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        session = get_object_or_404(ChatSession, session_key=pk)
        
        if request.method == 'GET':
            messages = session.messages.all().order_by('created_at')
            # Отдаем историю сообщений (включая привязанные продукты через get_products)
            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            input_serializer = ChatMessageInputSerializer(data=request.data)
            if input_serializer.is_valid():
                user_text = input_serializer.validated_data['text']
                
                # Обработка через сервис
                service = GeminiChatService()
                assistant_msg = service.process_message(session=session, user_text=user_text)
                
                # Возвращаем ответ ассистента вместе с продуктами
                serializer = ChatMessageSerializer(assistant_msg, context={'request': request})
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

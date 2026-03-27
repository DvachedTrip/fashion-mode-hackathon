from django.urls import path
from .views import ChatSessionViewSet

urlpatterns = [
    path('sessions/', ChatSessionViewSet.as_view({'post': 'create'}), name='chat-sessions'),
    path('sessions/<uuid:pk>/messages/', ChatSessionViewSet.as_view({'get': 'messages', 'post': 'messages'}), name='chat-messages'),
]

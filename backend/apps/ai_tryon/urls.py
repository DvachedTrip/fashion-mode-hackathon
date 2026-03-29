from django.urls import path
from .views import TryOnCreateView, TryOnDetailView
urlpatterns = [
    path('', TryOnCreateView.as_view(), name='tryon-create'),
    path('<int:pk>/', TryOnDetailView.as_view(), name='tryon-detail'),
]
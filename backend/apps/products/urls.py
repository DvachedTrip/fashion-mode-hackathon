from django.urls import path
from .views import CategoryListView, TagListView, ProductViewSet

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('', ProductViewSet.as_view({'get': 'list'}), name='product-list'),
    path('<int:pk>/', ProductViewSet.as_view({'get': 'retrieve'}), name='product-detail'),
]

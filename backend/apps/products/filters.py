import django_filters
from django.db.models import Q
from .models import Product, Category

class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_by_category')
    tag = django_filters.CharFilter(method='filter_by_tags')
    brand = django_filters.CharFilter(lookup_expr='iexact')
    color = django_filters.CharFilter(field_name='color__name', lookup_expr='iexact')
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    size = django_filters.CharFilter(field_name='sizes__size', lookup_expr='iexact')
    search = django_filters.CharFilter(method='filter_search')
    ordering = django_filters.OrderingFilter(
        fields=(
            ('price', 'price'),
            ('created_at', 'created_at'),
        )
    )

    class Meta:
        model = Product
        fields = ['category', 'tag', 'brand', 'color', 'price_min', 'price_max', 'size', 'search', 'ordering']

    def filter_by_category(self, queryset, name, value):
        """Filter by category slug, including all child categories."""
        try:
            category = Category.objects.get(slug=value)
        except Category.DoesNotExist:
            return queryset.none()
        
        # Collect all descendant category IDs
        category_ids = [category.id]
        children = list(category.children.all())
        while children:
            child = children.pop()
            category_ids.append(child.id)
            children.extend(list(child.children.all()))
        
        return queryset.filter(category_id__in=category_ids)

    def filter_by_tags(self, queryset, name, value):
        tags = self.data.getlist('tag')
        if tags:
            for tag_slug in tags:
                queryset = queryset.filter(tags__slug=tag_slug)
        return queryset

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) |
            Q(description__icontains=value) |
            Q(tags__name__icontains=value)
        ).distinct()

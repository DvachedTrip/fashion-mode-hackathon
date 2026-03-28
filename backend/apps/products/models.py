from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children'
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Color(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Название")
    hex_code = models.CharField(max_length=7, blank=True, verbose_name="HEX код")

    class Meta:
        verbose_name_plural = 'Colors'

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    brand = models.CharField(max_length=255)
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', verbose_name="Цвет")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    tags = models.ManyToManyField(Tag, through='ProductTag', related_name='products')

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.FileField(upload_to='products/')
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.product.name}"

class Size(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="Название")

    class Meta:
        verbose_name_plural = 'Sizes'

    def __str__(self):
        return self.name

class ProductSize(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes')
    size = models.ForeignKey(Size, on_delete=models.CASCADE, verbose_name="Размер")
    in_stock = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.size.name} for {self.product.name}"

class ProductTag(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('product', 'tag')

    def __str__(self):
        return f"{self.product.name} - {self.tag.name}"

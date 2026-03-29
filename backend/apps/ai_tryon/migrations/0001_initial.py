import django.db.models.deletion
from django.db import migrations, models
class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('products', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='TryOnRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(max_length=255)),
                ('user_photo', models.ImageField(upload_to='tryon_requests/user_photos/')),
                ('result_image', models.ImageField(blank=True, null=True, upload_to='tryon_requests/results/')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('done', 'Done'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='try_ons', to='products.product')),
            ],
        ),
    ]
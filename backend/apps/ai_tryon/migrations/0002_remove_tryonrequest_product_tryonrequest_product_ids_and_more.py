from django.db import migrations, models
class Migration(migrations.Migration):
    dependencies = [
        ('ai_tryon', '0001_initial'),
    ]
    operations = [
        migrations.RemoveField(
            model_name='tryonrequest',
            name='product',
        ),
        migrations.AddField(
            model_name='tryonrequest',
            name='product_ids',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='tryonrequest',
            name='prompt_used',
            field=models.TextField(blank=True, null=True),
        ),
    ]
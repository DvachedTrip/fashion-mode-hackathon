from django.db import models


class TryOnRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    )

    session_key = models.CharField(max_length=255)
    product_ids = models.JSONField(default=list)
    user_photo = models.ImageField(upload_to='tryon_requests/user_photos/')
    result_image = models.ImageField(upload_to='tryon_requests/results/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(null=True, blank=True)
    prompt_used = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TryOn {self.id} - {self.status}"

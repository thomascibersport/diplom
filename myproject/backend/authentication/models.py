from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.conf import settings
from django.db import models

def user_avatar_path(instance, filename):
    """Генерирует путь для сохранения аватарки"""
    return f"avatars/{instance.username}/{filename}"

class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, default="")
    agree_to_terms = models.BooleanField(default=False)
    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_permissions_set",
        blank=True,
    )
    
class RouteRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='route_records'
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    trip_duration = models.CharField(max_length=20)
    route_distance = models.CharField(max_length=50, blank=True, null=True)
    route_duration = models.CharField(max_length=50, blank=True, null=True)
    weather_description = models.CharField(max_length=255, blank=True, null=True)
    weather_temperature = models.CharField(max_length=20, blank=True, null=True)
    average_speed = models.CharField(max_length=20, blank=True, null=True)  # Новое поле
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Маршрут пользователя {self.user.username}"

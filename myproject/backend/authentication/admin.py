from django.contrib import admin
from .models import CustomUser  # Импорт вашей модели пользователя

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

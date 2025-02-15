from django.contrib import admin
from .models import CustomUser, RouteRecord

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(RouteRecord)
class RouteRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'start_time', 'end_time', 'start_location', 'end_location', 'trip_duration', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('start_location', 'end_location')

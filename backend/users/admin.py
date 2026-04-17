from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("email", "username", "first_name", "last_name", "role", "is_verified")
    list_filter = ("role", "is_verified", "is_active")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("-created_at",)
    fieldsets = UserAdmin.fieldsets + (
        ("Ek Bilgiler", {"fields": ("phone", "address", "profile_picture", "role", "is_verified")}),
    )

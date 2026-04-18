from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "email", "get_full_name", "role_badge", "phone",
        "is_verified", "is_active", "date_joined",
    )
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("email", "username", "first_name", "last_name", "phone")
    ordering = ("-date_joined",)
    list_per_page = 25
    date_hierarchy = "date_joined"

    fieldsets = UserAdmin.fieldsets + (
        ("Ek Bilgiler", {
            "fields": ("phone", "address", "profile_picture", "role", "is_verified"),
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Ek Bilgiler", {
            "fields": ("email", "first_name", "last_name", "phone", "role"),
        }),
    )

    readonly_fields = ("date_joined", "last_login")

    def role_badge(self, obj):
        colors = {
            "admin": "#e74c3c",
            "gallery_manager": "#3498db",
            "customer": "#27ae60",
        }
        color = colors.get(obj.role, "#95a5a6")
        labels = {"admin": "Yönetici", "gallery_manager": "Galeri Yöneticisi", "customer": "Müşteri"}
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, labels.get(obj.role, obj.role)
        )
    role_badge.short_description = "Rol"

    actions = ["verify_users", "deactivate_users"]

    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} kullanıcı doğrulandı.")
    verify_users.short_description = "Seçili kullanıcıları doğrula"

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} kullanıcı devre dışı bırakıldı.")
    deactivate_users.short_description = "Seçili kullanıcıları devre dışı bırak"

from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class User(AbstractUser):
    """Kullanıcı modeli - Hesap Yönetimi (Gereksinim 7)"""

    ROLE_CHOICES = [
        ("customer", "Müşteri"),
        ("admin", "Yönetici"),
        ("gallery_manager", "Galeri Yöneticisi"),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        verbose_name = "Kullanıcı"
        verbose_name_plural = "Kullanıcılar"
        indexes = [
            models.Index(fields=["email"], name="users_email_idx"),
            models.Index(fields=["role"], name="users_role_idx"),
            BrinIndex(fields=["created_at"], name="users_created_at_brin"),
        ]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

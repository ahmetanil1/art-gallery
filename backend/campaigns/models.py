from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class Campaign(models.Model):
    """Kampanya (Gereksinim 9)"""

    TYPE_CHOICES = [
        ("percentage", "Yüzde İndirim"),
        ("fixed", "Sabit İndirim"),
        ("free_slot", "Ücretsiz Katılım"),
    ]

    TARGET_CHOICES = [
        ("all", "Herkese Açık"),
        ("specific_users", "Belirli Kullanıcılar"),
        ("new_users", "Yeni Kullanıcılar"),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    discount_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    target = models.CharField(
        max_length=20, choices=TARGET_CHOICES, default="all"
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    artworks = models.ManyToManyField(
        "artworks.Artwork", blank=True, related_name="campaigns"
    )
    events = models.ManyToManyField(
        "events.Event", blank=True, related_name="campaigns"
    )

    class Meta:
        db_table = "campaigns"
        verbose_name = "Kampanya"
        verbose_name_plural = "Kampanyalar"
        indexes = [
            models.Index(fields=["is_active"], name="campaigns_active_idx"),
            BrinIndex(fields=["start_date", "end_date"], name="campaigns_dates_brin"),
        ]

    def __str__(self):
        return self.name


class Coupon(models.Model):
    """İndirim kuponu (Gereksinim 9)"""

    campaign = models.ForeignKey(
        Campaign, on_delete=models.CASCADE, related_name="coupons"
    )
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2)
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="assigned_coupons"
    )

    class Meta:
        db_table = "coupons"
        verbose_name = "Kupon"
        verbose_name_plural = "Kuponlar"
        indexes = [
            models.Index(fields=["is_active", "valid_until"], name="coupons_active_valid_idx"),
        ]

    def __str__(self):
        return f"{self.code} (%{self.discount_rate})"

    @property
    def is_valid(self):
        from django.utils import timezone
        return (
            self.is_active
            and self.used_count < self.max_uses
            and self.valid_from <= timezone.now() <= self.valid_until
        )

from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class Order(models.Model):
    """Sipariş - Satın Alma ve Ödeme (Gereksinim 6 & 8)"""

    STATUS_CHOICES = [
        ("pending", "Beklemede"),
        ("paid", "Ödendi"),
        ("shipped", "Kargoya Verildi"),
        ("delivered", "Teslim Edildi"),
        ("cancelled", "İptal Edildi"),
        ("refunded", "İade Edildi"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("credit_card", "Kredi Kartı"),
        ("debit_card", "Banka Kartı"),
        ("bank_transfer", "Havale/EFT"),
        ("cash", "Nakit"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    coupon = models.ForeignKey(
        "campaigns.Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    shipping_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "orders"
        verbose_name = "Sipariş"
        verbose_name_plural = "Siparişler"
        indexes = [
            models.Index(fields=["user", "status"], name="orders_user_status_idx"),
            BrinIndex(fields=["created_at"], name="orders_created_at_brin"),
        ]

    def __str__(self):
        return f"Sipariş #{self.id} - {self.user.email} ({self.status})"


class OrderItem(models.Model):
    """Sipariş kalemi"""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    artwork = models.ForeignKey(
        "artworks.Artwork",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"{self.artwork.title} x{self.quantity}"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class Payment(models.Model):
    """Ödeme kaydı (Gereksinim 6)"""

    STATUS_CHOICES = [
        ("pending", "Beklemede"),
        ("success", "Başarılı"),
        ("failed", "Başarısız"),
        ("refunded", "İade Edildi"),
    ]

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="payments"
    )
    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    transaction_id = models.CharField(max_length=200, blank=True, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        verbose_name = "Ödeme"
        verbose_name_plural = "Ödemeler"
        indexes = [
            models.Index(fields=["status"], name="payments_status_idx"),
            BrinIndex(fields=["created_at"], name="payments_created_at_brin"),
        ]

    def __str__(self):
        return f"Ödeme #{self.id} - {self.amount} TL ({self.status})"


class ReservationDiscount(models.Model):
    """Rezervasyona uygulanan kupon (Gereksinim 9)"""

    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.CASCADE,
        related_name="discounts",
    )
    coupon = models.ForeignKey(
        "campaigns.Coupon",
        on_delete=models.PROTECT,
        related_name="reservation_uses",
    )
    is_active = models.BooleanField(default=True)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reservation_discounts"
        unique_together = ("reservation", "coupon")

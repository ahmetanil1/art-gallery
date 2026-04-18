"""
Sepet modeli — veritabanında kalıcı sepet.
Her kullanıcının bir sepeti olur, sepet kalemleri CartItem'da tutulur.
"""
from django.conf import settings
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"
        verbose_name = "Sepet"
        verbose_name_plural = "Sepetler"

    def __str__(self):
        return f"{self.user.email} sepeti"

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        return self.items.count()


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    artwork = models.ForeignKey(
        "artworks.Artwork", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cart_items"
        unique_together = ("cart", "artwork")
        verbose_name = "Sepet Kalemi"

    def __str__(self):
        return f"{self.cart.user.email} — {self.artwork.title}"

    @property
    def subtotal(self):
        return self.artwork.price * self.quantity

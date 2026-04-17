from rest_framework import serializers

from artworks.serializers import ArtworkListSerializer
from campaigns.models import Coupon
from .models import Order, OrderItem, Payment


class OrderItemSerializer(serializers.ModelSerializer):
    artwork_detail = ArtworkListSerializer(source="artwork", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "artwork", "artwork_detail", "quantity", "unit_price", "subtotal")
        read_only_fields = ("unit_price",)


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("artwork", "quantity")

    def validate(self, attrs):
        artwork = attrs["artwork"]
        if artwork.status != "available":
            raise serializers.ValidationError(
                f"'{artwork.title}' eseri şu an satışta değil."
            )
        return attrs


class OrderCreateSerializer(serializers.ModelSerializer):
    """Gereksinim 6 - Satın alma"""

    items = OrderItemCreateSerializer(many=True, write_only=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = ("id", "items", "payment_method", "shipping_address", "notes", "coupon_code")

    def validate_coupon_code(self, value):
        if not value:
            return None
        try:
            coupon = Coupon.objects.get(code=value)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Geçersiz kupon kodu.")
        if not coupon.is_valid:
            raise serializers.ValidationError("Bu kupon artık geçerli değil.")
        return coupon

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon = validated_data.pop("coupon_code", None)

        # Toplam tutarı hesapla
        total = sum(
            item["artwork"].price * item["quantity"]
            for item in items_data
        )
        discount = 0
        if coupon:
            discount = total * (coupon.discount_rate / 100)
            coupon.used_count += 1
            coupon.save()

        order = Order.objects.create(
            user=self.context["request"].user,
            total_amount=total - discount,
            discount_amount=discount,
            coupon=coupon,
            **validated_data,
        )

        for item_data in items_data:
            artwork = item_data["artwork"]
            OrderItem.objects.create(
                order=order,
                artwork=artwork,
                quantity=item_data["quantity"],
                unit_price=artwork.price,
            )
            # Eseri satıldı olarak işaretle
            if item_data["quantity"] >= 1:
                artwork.status = "sold"
                artwork.save()

        return order


class OrderSerializer(serializers.ModelSerializer):
    """Gereksinim 8 - Sipariş takibi"""

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "status", "payment_method", "total_amount",
            "discount_amount", "coupon", "shipping_address",
            "notes", "items", "created_at", "updated_at", "paid_at",
        )
        read_only_fields = (
            "status", "total_amount", "discount_amount",
            "coupon", "created_at", "updated_at", "paid_at",
        )


class PaymentSerializer(serializers.ModelSerializer):
    """Gereksinim 6 - Ödeme"""

    class Meta:
        model = Payment
        fields = (
            "id", "order", "reservation", "amount",
            "method", "status", "transaction_id", "paid_at", "created_at",
        )
        read_only_fields = ("status", "transaction_id", "paid_at", "created_at")

    def create(self, validated_data):
        from django.utils import timezone
        payment = Payment.objects.create(**validated_data)
        # Ödeme başarılı simülasyonu
        payment.status = "success"
        payment.paid_at = timezone.now()
        payment.transaction_id = f"TXN-{payment.id:08d}"
        payment.save()

        # Siparişi güncelle
        if payment.order:
            payment.order.status = "paid"
            payment.order.paid_at = timezone.now()
            payment.order.save()

        # Rezervasyonu güncelle
        if payment.reservation:
            payment.reservation.status = "confirmed"
            payment.reservation.save()

        return payment

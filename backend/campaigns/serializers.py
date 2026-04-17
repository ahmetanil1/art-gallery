from django.utils import timezone
from rest_framework import serializers

from .models import Campaign, Coupon


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id", "code", "discount_rate", "max_uses", "used_count",
            "valid_from", "valid_until", "is_active", "is_valid",
        )
        read_only_fields = ("used_count",)


class CampaignSerializer(serializers.ModelSerializer):
    """Gereksinim 9 - Kampanyalar"""

    coupons = CouponSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = (
            "id", "name", "description", "discount_type",
            "discount_rate", "discount_amount", "target",
            "start_date", "end_date", "is_active",
            "artworks", "events", "coupons",
        )


class ApplyCouponSerializer(serializers.Serializer):
    """Kupon uygulama - Gereksinim 9"""

    code = serializers.CharField(max_length=50)

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Geçersiz kupon kodu.")

        if not coupon.is_valid:
            raise serializers.ValidationError("Bu kupon artık geçerli değil.")

        # Belirli kullanıcılara özel kontrol
        user = self.context["request"].user
        if coupon.campaign.target == "specific_users":
            if not coupon.assigned_users.filter(pk=user.pk).exists():
                raise serializers.ValidationError("Bu kupon size özel değil.")

        self.coupon = coupon
        return value

from rest_framework import serializers
from .cart_models import Cart, CartItem
from artworks.models import Artwork


class CartItemArtworkSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    artist_name = serializers.SerializerMethodField()
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()
    primary_image = serializers.SerializerMethodField()

    def get_artist_name(self, obj):
        return obj.artist.name

    def get_primary_image(self, obj):
        request = self.context.get("request")
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class CartItemSerializer(serializers.ModelSerializer):
    artwork_detail = CartItemArtworkSerializer(source="artwork", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "artwork", "artwork_detail", "quantity", "subtotal", "added_at")
        read_only_fields = ("added_at",)

    def validate_artwork(self, value):
        if value.status != "available":
            raise serializers.ValidationError(f"'{value.title}' eseri şu an satışta değil.")
        return value

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Miktar en az 1 olmalıdır.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    # Kupon uygulandıysa
    coupon_code = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    total_after_discount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id", "items", "item_count", "subtotal",
            "coupon_code", "discount_amount", "total_after_discount",
            "updated_at",
        )

    def get_coupon_code(self, obj):
        return self.context.get("coupon_code")

    def get_discount_amount(self, obj):
        coupon = self.context.get("coupon")
        if coupon:
            return round(float(obj.subtotal) * float(coupon.discount_rate) / 100, 2)
        return 0

    def get_total_after_discount(self, obj):
        coupon = self.context.get("coupon")
        subtotal = float(obj.subtotal)
        if coupon:
            discount = subtotal * float(coupon.discount_rate) / 100
            return round(subtotal - discount, 2)
        return subtotal

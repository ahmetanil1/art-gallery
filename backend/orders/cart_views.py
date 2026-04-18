from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from campaigns.models import Coupon
from .cart_models import Cart, CartItem
from .cart_serializers import CartSerializer, CartItemSerializer


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """GET /api/cart/ — sepeti getir"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        cart_qs = Cart.objects.prefetch_related(
            "items__artwork__artist",
            "items__artwork__images",
        ).get(pk=cart.pk)

        # Session'dan kupon bilgisi
        coupon_code = request.session.get("cart_coupon_code")
        coupon = None
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code)
                if not coupon.is_valid:
                    coupon = None
                    del request.session["cart_coupon_code"]
            except Coupon.DoesNotExist:
                coupon = None

        serializer = CartSerializer(
            cart_qs,
            context={"request": request, "coupon": coupon, "coupon_code": coupon_code},
        )
        return Response(serializer.data)


class CartAddView(APIView):
    """POST /api/cart/add/ — sepete eser ekle"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = get_or_create_cart(request.user)
        artwork_id = request.data.get("artwork_id")
        quantity = int(request.data.get("quantity", 1))

        if not artwork_id:
            return Response({"detail": "artwork_id gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        from artworks.models import Artwork
        try:
            artwork = Artwork.objects.get(pk=artwork_id)
        except Artwork.DoesNotExist:
            return Response({"detail": "Eser bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        if artwork.status != "available":
            return Response({"detail": "Bu eser satışta değil."}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(
            cart=cart, artwork=artwork,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save()

        return Response(
            {"detail": "Sepete eklendi.", "item_count": cart.item_count},
            status=status.HTTP_201_CREATED,
        )


class CartUpdateView(APIView):
    """PATCH /api/cart/items/<id>/ — miktar güncelle"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"detail": "Kalem bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get("quantity", 1))
        if quantity < 1:
            item.delete()
            return Response({"detail": "Kalem sepetten çıkarıldı."})

        item.quantity = quantity
        item.save()
        return Response(CartItemSerializer(item, context={"request": request}).data)


class CartRemoveView(APIView):
    """DELETE /api/cart/items/<id>/ — sepetten çıkar"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"detail": "Kalem bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response({"detail": "Sepetten çıkarıldı.", "item_count": cart.item_count})


class CartClearView(APIView):
    """DELETE /api/cart/clear/ — sepeti temizle"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        request.session.pop("cart_coupon_code", None)
        return Response({"detail": "Sepet temizlendi."})


class CartApplyCouponView(APIView):
    """POST /api/cart/apply-coupon/ — kupon uygula"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        if not code:
            return Response({"detail": "Kupon kodu gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({"detail": "Geçersiz kupon kodu."}, status=status.HTTP_400_BAD_REQUEST)

        if not coupon.is_valid:
            return Response({"detail": "Bu kupon artık geçerli değil."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.campaign.target == "specific_users":
            if not coupon.assigned_users.filter(pk=request.user.pk).exists():
                return Response({"detail": "Bu kupon size özel değil."}, status=status.HTTP_400_BAD_REQUEST)

        request.session["cart_coupon_code"] = code
        cart = get_or_create_cart(request.user)
        discount = float(cart.subtotal) * float(coupon.discount_rate) / 100

        return Response({
            "detail": "Kupon uygulandı!",
            "code": code,
            "discount_rate": coupon.discount_rate,
            "discount_amount": round(discount, 2),
            "total_after_discount": round(float(cart.subtotal) - discount, 2),
        })


class CartRemoveCouponView(APIView):
    """DELETE /api/cart/remove-coupon/ — kuponu kaldır"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        request.session.pop("cart_coupon_code", None)
        return Response({"detail": "Kupon kaldırıldı."})


class CartCheckoutView(APIView):
    """POST /api/cart/checkout/ — sepetten sipariş oluştur ve öde"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart = get_or_create_cart(request.user)
        items = cart.items.select_related("artwork").all()

        if not items.exists():
            return Response({"detail": "Sepetiniz boş."}, status=status.HTTP_400_BAD_REQUEST)

        # Stok kontrolü
        for item in items:
            if item.artwork.status != "available":
                return Response(
                    {"detail": f"'{item.artwork.title}' artık satışta değil."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Kupon
        coupon_code = request.session.get("cart_coupon_code")
        coupon = None
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code)
                if not coupon.is_valid:
                    coupon = None
            except Coupon.DoesNotExist:
                pass

        subtotal = sum(item.subtotal for item in items)
        discount = 0
        if coupon:
            discount = subtotal * (coupon.discount_rate / 100)
            coupon.used_count += 1
            coupon.save()

        payment_method = request.data.get("payment_method", "credit_card")
        shipping_address = request.data.get("shipping_address", "")

        from orders.models import Order, OrderItem, Payment
        from django.utils import timezone

        order = Order.objects.create(
            user=request.user,
            status="paid",
            payment_method=payment_method,
            total_amount=subtotal - discount,
            discount_amount=discount,
            coupon=coupon,
            shipping_address=shipping_address,
            paid_at=timezone.now(),
        )

        for item in items:
            OrderItem.objects.create(
                order=order,
                artwork=item.artwork,
                quantity=item.quantity,
                unit_price=item.artwork.price,
            )
            item.artwork.status = "sold"
            item.artwork.save()

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            method=payment_method,
            status="success",
            transaction_id=f"TXN-{order.id:08d}",
            paid_at=timezone.now(),
        )

        # Sepeti temizle
        cart.items.all().delete()
        request.session.pop("cart_coupon_code", None)

        return Response({
            "detail": "Sipariş başarıyla oluşturuldu!",
            "order_id": order.id,
            "total_amount": str(order.total_amount),
            "discount_amount": str(order.discount_amount),
        }, status=status.HTTP_201_CREATED)

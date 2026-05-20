from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order, Payment
from .serializers import OrderCreateSerializer, OrderSerializer, PaymentSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 6 - Satın alma ve ödeme
    Gereksinim 8 - Sipariş takibi
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related(
            "items__artwork__artist", "items__artwork__images"
        )
        if user.role in ("admin", "gallery_manager"):
            status_filter = self.request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs.order_by("-created_at")

        qs = qs.filter(user=user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def http_method_not_allowed(self, request, *args, **kwargs):
        return super().http_method_not_allowed(request, *args, **kwargs)

    # Adminler order durumunu güncelleyebilir
    http_method_names = ["get", "post", "patch", "head", "options"]

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        """Gereksinim 6 - Ödeme işlemi"""
        order = self.get_object()

        if order.status != "pending":
            return Response(
                {"detail": "Bu sipariş zaten ödenmiş veya iptal edilmiş."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {
            "order": order.id,
            "amount": order.total_amount,
            "method": request.data.get("method", "credit_card"),
        }
        serializer = PaymentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Ödeme başarılı.", "payment": serializer.data})


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Ödeme geçmişi"""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(order__user=self.request.user).order_by("-created_at")

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Campaign, Coupon
from .serializers import ApplyCouponSerializer, CampaignSerializer, CouponSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ("admin", "gallery_manager")


class CampaignViewSet(viewsets.ModelViewSet):
    """Gereksinim 9 - Kampanyalar ve indirimler"""

    serializer_class = CampaignSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Campaign.objects.prefetch_related("coupons", "artworks", "events")
        # Aktif kampanyaları filtrele
        active_only = self.request.query_params.get("active")
        if active_only == "true":
            from django.utils import timezone
            now = timezone.now()
            qs = qs.filter(is_active=True, start_date__lte=now, end_date__gte=now)
        return qs

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def validate_coupon(self, request):
        """Gereksinim 9 - Kupon doğrulama"""
        serializer = ApplyCouponSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        coupon = serializer.coupon
        return Response({
            "code": coupon.code,
            "discount_rate": coupon.discount_rate,
            "campaign": coupon.campaign.name,
        })

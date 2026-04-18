"""
Admin API — sadece admin/gallery_manager rolündeki kullanıcılar erişebilir.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "gallery_manager")


class IsStrictAdmin(permissions.BasePermission):
    """Sadece admin rolü"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


# ── Serializers ────────────────────────────────────────────────────────────────

class AdminUserListSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    reservation_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "first_name", "last_name",
            "phone", "role", "is_active", "is_verified",
            "date_joined", "last_login",
            "order_count", "reservation_count",
        )

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_reservation_count(self, obj):
        return obj.reservations.count()


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("role", "is_active", "is_verified", "first_name", "last_name", "phone")


# ── Views ──────────────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """GET /api/admin/dashboard/ — genel istatistikler"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from artworks.models import Artwork
        from events.models import Event
        from orders.models import Order
        from reservations.models import Reservation
        from reviews.models import ArtworkReview, EventReview
        from support.models import SupportTicket

        now = timezone.now()
        last_30 = now - timedelta(days=30)
        last_7 = now - timedelta(days=7)

        # Genel sayılar
        stats = {
            "users": {
                "total": User.objects.count(),
                "new_last_30_days": User.objects.filter(date_joined__gte=last_30).count(),
                "new_last_7_days": User.objects.filter(date_joined__gte=last_7).count(),
                "active": User.objects.filter(is_active=True).count(),
                "by_role": list(User.objects.values("role").annotate(count=Count("id"))),
            },
            "artworks": {
                "total": Artwork.objects.count(),
                "available": Artwork.objects.filter(status="available").count(),
                "sold": Artwork.objects.filter(status="sold").count(),
                "total_views": Artwork.objects.aggregate(v=Sum("view_count"))["v"] or 0,
                "avg_price": Artwork.objects.aggregate(a=Avg("price"))["a"],
            },
            "events": {
                "total": Event.objects.count(),
                "upcoming": Event.objects.filter(status="upcoming").count(),
                "completed": Event.objects.filter(status="completed").count(),
                "avg_occupancy": None,
            },
            "orders": {
                "total": Order.objects.count(),
                "paid": Order.objects.filter(status="paid").count(),
                "pending": Order.objects.filter(status="pending").count(),
                "revenue_total": Order.objects.filter(status__in=["paid", "delivered"]).aggregate(
                    s=Sum("total_amount")
                )["s"] or 0,
                "revenue_last_30_days": Order.objects.filter(
                    status__in=["paid", "delivered"], paid_at__gte=last_30
                ).aggregate(s=Sum("total_amount"))["s"] or 0,
            },
            "reservations": {
                "total": Reservation.objects.count(),
                "confirmed": Reservation.objects.filter(status="confirmed").count(),
                "pending": Reservation.objects.filter(status="pending").count(),
                "cancelled": Reservation.objects.filter(status="cancelled").count(),
            },
            "reviews": {
                "artwork_reviews": ArtworkReview.objects.count(),
                "event_reviews": EventReview.objects.count(),
                "pending_approval": ArtworkReview.objects.filter(is_approved=False).count()
                    + EventReview.objects.filter(is_approved=False).count(),
            },
            "support": {
                "open": SupportTicket.objects.filter(status="open").count(),
                "in_progress": SupportTicket.objects.filter(status="in_progress").count(),
                "resolved": SupportTicket.objects.filter(status="resolved").count(),
            },
        }

        # Son 7 günlük sipariş grafiği
        daily_orders = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59)
            count = Order.objects.filter(created_at__range=(day_start, day_end)).count()
            revenue = Order.objects.filter(
                created_at__range=(day_start, day_end),
                status__in=["paid", "delivered"]
            ).aggregate(s=Sum("total_amount"))["s"] or 0
            daily_orders.append({
                "date": day.strftime("%d.%m"),
                "orders": count,
                "revenue": float(revenue),
            })

        stats["daily_orders"] = daily_orders

        # En çok görüntülenen eserler
        from artworks.models import Artwork
        top_artworks = list(
            Artwork.objects.order_by("-view_count")[:5].values(
                "id", "title", "view_count", "price", "status"
            )
        )
        stats["top_artworks"] = top_artworks

        return Response(stats)


class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — kullanıcı listesi"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        qs = User.objects.prefetch_related("orders", "reservations").order_by("-date_joined")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        is_active = self.request.query_params.get("is_active")

        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        if is_active is not None:
            qs = qs.filter(is_active=is_active == "true")
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/admin/users/<id>/ — kullanıcı detay ve güncelleme"""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserUpdateSerializer
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method == "GET":
            return AdminUserListSerializer
        return AdminUserUpdateSerializer

    def update(self, request, *args, **kwargs):
        # Sadece admin başka kullanıcıya admin rolü verebilir
        if "role" in request.data and request.data["role"] == "admin":
            if request.user.role != "admin":
                return Response(
                    {"detail": "Sadece admin başka kullanıcıya admin rolü verebilir."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)


class AdminUserToggleActiveView(APIView):
    """POST /api/admin/users/<id>/toggle-active/ — aktif/pasif yap"""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Kullanıcı bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"detail": "Kendinizi devre dışı bırakamazsınız."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = not user.is_active
        user.save()
        return Response({
            "detail": f"Kullanıcı {'aktif' if user.is_active else 'pasif'} yapıldı.",
            "is_active": user.is_active,
        })


class AdminAnalyticsView(APIView):
    """GET /api/admin/analytics/ — detaylı analitik"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from artworks.models import Artwork, Category
        from events.models import Event
        from orders.models import Order, OrderItem
        from reservations.models import Reservation

        now = timezone.now()

        # Kategori bazlı eser dağılımı
        category_stats = list(
            Category.objects.annotate(
                artwork_count=Count("artworks"),
                sold_count=Count("artworks", filter=Q(artworks__status="sold")),
            ).values("name", "artwork_count", "sold_count")
        )

        # Aylık gelir (son 6 ay)
        monthly_revenue = []
        for i in range(5, -1, -1):
            month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0)
            if i > 0:
                month_end = (now - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0)
            else:
                month_end = now
            revenue = Order.objects.filter(
                paid_at__range=(month_start, month_end),
                status__in=["paid", "delivered"],
            ).aggregate(s=Sum("total_amount"))["s"] or 0
            monthly_revenue.append({
                "month": month_start.strftime("%b %Y"),
                "revenue": float(revenue),
            })

        # En çok satan eserler
        top_selling = list(
            OrderItem.objects.values("artwork__title", "artwork__id")
            .annotate(total_sold=Count("id"), total_revenue=Sum("unit_price"))
            .order_by("-total_sold")[:10]
        )

        # Etkinlik doluluk oranları
        event_occupancy = []
        for ev in Event.objects.filter(status__in=["upcoming", "completed"])[:10]:
            event_occupancy.append({
                "id": ev.id,
                "title": ev.title,
                "capacity": ev.capacity,
                "occupancy_rate": ev.occupancy_rate,
                "available_slots": ev.available_slots,
            })

        # Rezervasyon durum dağılımı
        reservation_stats = list(
            Reservation.objects.values("status").annotate(count=Count("id"))
        )

        return Response({
            "category_stats": category_stats,
            "monthly_revenue": monthly_revenue,
            "top_selling_artworks": top_selling,
            "event_occupancy": event_occupancy,
            "reservation_stats": reservation_stats,
        })

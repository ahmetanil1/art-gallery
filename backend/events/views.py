from rest_framework import filters, permissions, viewsets
from rest_framework.response import Response

from .models import Event, EventCategory, EventComparison
from .serializers import (
    EventCategorySerializer,
    EventComparisonSerializer,
    EventDetailSerializer,
    EventListSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ("admin", "gallery_manager")


class EventCategoryViewSet(viewsets.ModelViewSet):
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class EventViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 2 - Atölye ve Etkinlikleri Görüntüleme
    Gereksinim 16 - İstatistik
    """

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["start_datetime", "price", "capacity", "created_at"]
    ordering = ["start_datetime"]

    def get_queryset(self):
        qs = Event.objects.select_related("category", "organizer")
        params = self.request.query_params

        event_type = params.get("type")
        status_filter = params.get("status")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        date_from = params.get("date_from")
        date_to = params.get("date_to")

        if event_type:
            qs = qs.filter(event_type=event_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if date_from:
            qs = qs.filter(start_datetime__date__gte=date_from)
        if date_to:
            qs = qs.filter(start_datetime__date__lte=date_to)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        return EventDetailSerializer


class EventComparisonViewSet(viewsets.ModelViewSet):
    """Gereksinim 11 - Etkinlik karşılaştırma"""

    serializer_class = EventComparisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventComparison.objects.filter(
            user=self.request.user
        ).prefetch_related("events__category")

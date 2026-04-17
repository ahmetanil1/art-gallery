from django.db.models import Avg, Count
from rest_framework import filters, generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Artist, Artwork, ArtworkComparison, Category, Favorite
from .serializers import (
    ArtistSerializer,
    ArtworkComparisonSerializer,
    ArtworkDetailSerializer,
    ArtworkListSerializer,
    CategorySerializer,
    FavoriteSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ("admin", "gallery_manager")


class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "nationality"]
    ordering_fields = ["name", "birth_year"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class ArtworkViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 1 - Eserleri İnceleme
    Gereksinim 16 - İstatistik (view_count, review_count, avg_rating)
    """

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "artist__name", "medium"]
    ordering_fields = ["price", "created_at", "view_count", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Artwork.objects.select_related("artist", "category").prefetch_related("images")
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        artist = self.request.query_params.get("artist")
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category__slug=category)
        if artist:
            qs = qs.filter(artist_id=artist)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ArtworkListSerializer
        return ArtworkDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        """Görüntülenme sayısını artır - Gereksinim 16"""
        instance = self.get_object()
        Artwork.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        """Gereksinim 16 - İstatistik ve Raporlama (yönetici)"""
        if request.user.role not in ("admin", "gallery_manager"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        data = Artwork.objects.aggregate(
            total=Count("id"),
            total_views=__import__("django.db.models", fromlist=["Sum"]).Sum("view_count"),
        )
        top = (
            Artwork.objects.annotate(avg_r=Avg("reviews__rating"))
            .order_by("-avg_r")[:5]
            .values("id", "title", "avg_r", "view_count")
        )
        return Response({"summary": data, "top_rated": list(top)})


class FavoriteListView(generics.ListCreateAPIView):
    """Gereksinim 3 - Favorilere ekleme / listeleme"""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            "artwork__artist", "artwork__category"
        ).prefetch_related("artwork__images")


class FavoriteDeleteView(generics.DestroyAPIView):
    """Gereksinim 3 - Favorilerden çıkarma"""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class ArtworkComparisonViewSet(viewsets.ModelViewSet):
    """Gereksinim 11 - Eser karşılaştırma"""

    serializer_class = ArtworkComparisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ArtworkComparison.objects.filter(
            user=self.request.user
        ).prefetch_related("artworks__artist", "artworks__images")

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ArtistViewSet,
    ArtworkComparisonViewSet,
    ArtworkViewSet,
    CategoryViewSet,
    FavoriteDeleteView,
    FavoriteListView,
)
from .upload_views import (
    AdminArtworkCreateView,
    AdminArtworkUpdateView,
    AdminArtworkImageUploadView,
    AdminArtworkSetPrimaryImageView,
)

router = DefaultRouter()
router.register("artworks", ArtworkViewSet, basename="artwork")
router.register("artists", ArtistViewSet, basename="artist")
router.register("categories", CategoryViewSet, basename="category")
router.register("comparisons", ArtworkComparisonViewSet, basename="artwork-comparison")

urlpatterns = [
    path("", include(router.urls)),
    path("favorites/", FavoriteListView.as_view(), name="favorites-list"),
    path("favorites/<int:pk>/", FavoriteDeleteView.as_view(), name="favorites-delete"),
    # Admin eser yönetimi
    path("admin/artworks/", AdminArtworkCreateView.as_view(), name="admin-artwork-create"),
    path("admin/artworks/<int:pk>/", AdminArtworkUpdateView.as_view(), name="admin-artwork-detail"),
    path("admin/artworks/<int:artwork_id>/images/", AdminArtworkImageUploadView.as_view(), name="admin-artwork-images"),
    path("admin/artworks/<int:artwork_id>/images/<int:image_id>/set-primary/", AdminArtworkSetPrimaryImageView.as_view(), name="admin-artwork-set-primary"),
]

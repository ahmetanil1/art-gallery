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

router = DefaultRouter()
router.register("artworks", ArtworkViewSet, basename="artwork")
router.register("artists", ArtistViewSet, basename="artist")
router.register("categories", CategoryViewSet, basename="category")
router.register("comparisons", ArtworkComparisonViewSet, basename="artwork-comparison")

urlpatterns = [
    path("", include(router.urls)),
    path("favorites/", FavoriteListView.as_view(), name="favorites-list"),
    path("favorites/<int:pk>/", FavoriteDeleteView.as_view(), name="favorites-delete"),
]

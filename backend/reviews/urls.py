from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ArtworkReviewViewSet, EventReviewViewSet

router = DefaultRouter()
router.register("artwork-reviews", ArtworkReviewViewSet, basename="artwork-review")
router.register("event-reviews", EventReviewViewSet, basename="event-review")

urlpatterns = [
    path("", include(router.urls)),
]

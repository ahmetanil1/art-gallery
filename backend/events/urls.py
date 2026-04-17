from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventCategoryViewSet, EventComparisonViewSet, EventViewSet

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")
router.register("event-categories", EventCategoryViewSet, basename="event-category")
router.register("event-comparisons", EventComparisonViewSet, basename="event-comparison")

urlpatterns = [
    path("", include(router.urls)),
]

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from users.admin_views import (
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserToggleActiveView,
    AdminAnalyticsView,
)

# Admin panel özelleştirme
admin.site.site_header = "🎨 Sanat Galerisi Yönetim Paneli"
admin.site.site_title = "Sanat Galerisi Admin"
admin.site.index_title = "Yönetim Paneli"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/", include("artworks.urls")),
    path("api/", include("events.urls")),
    path("api/", include("reservations.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("campaigns.urls")),
    path("api/", include("reviews.urls")),
    path("api/", include("support.urls")),
    # Admin API
    path("api/admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("api/admin/analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("api/admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("api/admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("api/admin/users/<int:pk>/toggle-active/", AdminUserToggleActiveView.as_view(), name="admin-user-toggle"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

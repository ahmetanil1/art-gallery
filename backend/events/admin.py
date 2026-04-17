from django.contrib import admin
from .models import Event, EventCategory, EventComparison


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "start_datetime", "capacity", "price", "status")
    list_filter = ("status", "event_type")
    search_fields = ("title", "location")


admin.site.register(EventCategory)
admin.site.register(EventComparison)

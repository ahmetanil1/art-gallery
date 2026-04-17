from django.contrib import admin
from .models import SupportMessage, SupportTicket


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "subject", "category", "status", "created_at")
    list_filter = ("status", "category")
    search_fields = ("user__email", "subject")
    inlines = [SupportMessageInline]

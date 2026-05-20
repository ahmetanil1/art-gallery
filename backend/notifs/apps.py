from django.apps import AppConfig


class NotifsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifs"
    verbose_name = "Bildirimler"

    def ready(self):
        import notifs.signals  # noqa: F401

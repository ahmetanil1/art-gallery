import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sanat_galerisi.settings")

# Django ASGI uygulamasını önce başlat (model importları için)
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from support.routing import websocket_urlpatterns as support_ws   # noqa: E402
from notifs.routing import websocket_urlpatterns as notif_ws      # noqa: E402
from support.ws_middleware import JWTAuthMiddleware                # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
            URLRouter(support_ws + notif_ws)
        ),
    }
)

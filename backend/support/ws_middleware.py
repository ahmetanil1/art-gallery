"""
WebSocket için JWT kimlik doğrulama middleware'i.
Bağlantı URL'sindeki ?token=<jwt> parametresini okur.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token_key):
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import TokenError

    User = get_user_model()
    try:
        token = AccessToken(token_key)
        user_id = token["user_id"]
        return User.objects.get(pk=int(user_id))
    except (TokenError, User.DoesNotExist, KeyError, ValueError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Query string'den token al: ws://...?token=xxx
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        if token_list:
            scope["user"] = await get_user_from_token(token_list[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

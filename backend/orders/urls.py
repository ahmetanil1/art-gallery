from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, PaymentViewSet
from .cart_views import (
    CartView, CartAddView, CartUpdateView,
    CartRemoveView, CartClearView,
    CartApplyCouponView, CartRemoveCouponView,
    CartCheckoutView,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = [
    path("", include(router.urls)),
    # Sepet
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", CartAddView.as_view(), name="cart-add"),
    path("cart/items/<int:item_id>/", CartUpdateView.as_view(), name="cart-item-update"),
    path("cart/items/<int:item_id>/remove/", CartRemoveView.as_view(), name="cart-item-remove"),
    path("cart/clear/", CartClearView.as_view(), name="cart-clear"),
    path("cart/apply-coupon/", CartApplyCouponView.as_view(), name="cart-apply-coupon"),
    path("cart/remove-coupon/", CartRemoveCouponView.as_view(), name="cart-remove-coupon"),
    path("cart/checkout/", CartCheckoutView.as_view(), name="cart-checkout"),
]

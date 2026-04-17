import api from "../lib/axios";
import type { Order } from "../types";

export const orderService = {
  list: () =>
    api.get<Order[]>("/orders/").then((r) => r.data),

  create: (data: {
    items: { artwork: number; quantity: number }[];
    payment_method: string;
    shipping_address?: string;
    coupon_code?: string;
  }) => api.post<Order>("/orders/", data).then((r) => r.data),

  pay: (orderId: number, method: string) =>
    api.post(`/orders/${orderId}/pay/`, { method }).then((r) => r.data),

  validateCoupon: (code: string) =>
    api.post("/campaigns/validate_coupon/", { code }).then((r) => r.data),
};

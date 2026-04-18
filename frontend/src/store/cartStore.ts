import { create } from "zustand";
import api from "../lib/axios";

export interface CartItem {
  id: number;
  artwork: number;
  artwork_detail: {
    id: number;
    title: string;
    artist_name: string;
    price: string;
    status: string;
    primary_image: string | null;
  };
  quantity: number;
  subtotal: string;
}

export interface CartState {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  coupon_code: string | null;
  discount_amount: number;
  total_after_discount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (artworkId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<any>;
  removeCoupon: () => Promise<void>;
  checkout: (paymentMethod: string, shippingAddress?: string) => Promise<any>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  item_count: 0,
  subtotal: 0,
  coupon_code: null,
  discount_amount: 0,
  total_after_discount: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/cart/");
      set({
        items: data.items || [],
        item_count: data.item_count || 0,
        subtotal: data.subtotal || 0,
        coupon_code: data.coupon_code || null,
        discount_amount: data.discount_amount || 0,
        total_after_discount: data.total_after_discount || data.subtotal || 0,
      });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (artworkId, quantity = 1) => {
    await api.post("/cart/add/", { artwork_id: artworkId, quantity });
    await get().fetchCart();
  },

  updateItem: async (itemId, quantity) => {
    if (quantity < 1) {
      await get().removeItem(itemId);
      return;
    }
    await api.patch(`/cart/items/${itemId}/`, { quantity });
    await get().fetchCart();
  },

  removeItem: async (itemId) => {
    await api.delete(`/cart/items/${itemId}/remove/`);
    await get().fetchCart();
  },

  clearCart: async () => {
    await api.delete("/cart/clear/");
    set({ items: [], item_count: 0, subtotal: 0, coupon_code: null, discount_amount: 0, total_after_discount: 0 });
  },

  applyCoupon: async (code) => {
    const { data } = await api.post("/cart/apply-coupon/", { code });
    await get().fetchCart();
    return data;
  },

  removeCoupon: async () => {
    await api.delete("/cart/remove-coupon/");
    await get().fetchCart();
  },

  checkout: async (paymentMethod, shippingAddress = "") => {
    const { data } = await api.post("/cart/checkout/", {
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
    });
    await get().fetchCart();
    return data;
  },
}));

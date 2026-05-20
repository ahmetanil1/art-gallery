import { create } from "zustand";
import api from "../lib/axios";

export interface Notif {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
  order_id?: number | null;
  reservation_id?: number | null;
  support_id?: number | null;
  review_id?: number | null;
}

interface NotifState {
  notifs: Notif[];
  unread: number;
  connected: boolean;
  loading: boolean;
  fetchNotifs: () => Promise<void>;
  addNotif: (n: Notif) => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  setConnected: (v: boolean) => void;
}

export const useNotifStore = create<NotifState>((set, get) => ({
  notifs:    [],
  unread:    0,
  connected: false,
  loading:   false,

  fetchNotifs: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/notifications/");
      const list: Notif[] = data.results ?? data;
      set({ notifs: list, unread: list.filter((n) => !n.is_read).length });
    } catch { /* ignore */ } finally {
      set({ loading: false });
    }
  },

  addNotif: (n) => {
    set((s) => ({
      notifs: [n, ...s.notifs].slice(0, 50),
      unread: s.unread + (n.is_read ? 0 : 1),
    }));
  },

  markRead: async (id) => {
    await api.post(`/notifications/${id}/mark_read/`);
    set((s) => ({
      notifs: s.notifs.map((n) => n.id === id ? { ...n, is_read: true } : n),
      unread: Math.max(0, s.unread - 1),
    }));
  },

  markAllRead: async () => {
    await api.post("/notifications/mark_all_read/");
    set((s) => ({
      notifs: s.notifs.map((n) => ({ ...n, is_read: true })),
      unread: 0,
    }));
  },

  setConnected: (v) => set({ connected: v }),
}));

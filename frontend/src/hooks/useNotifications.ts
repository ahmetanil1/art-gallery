/**
 * useNotifications — WebSocket ile anlık bildirim akışı
 * ws://host/ws/notifications/?token=<jwt>
 */
import { useEffect, useRef, useCallback } from "react";
import { useNotifStore } from "../store/notifStore";

const WS_BASE = import.meta.env.DEV
  ? `ws://${window.location.hostname}:8000/ws`
  : `ws://${window.location.host}/ws`;

export function useNotifications(enabled: boolean) {
  const { addNotif, setConnected } = useNotifStore();
  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef     = useRef(true);

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_BASE}/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen  = () => { if (mountedRef.current) setConnected(true); };
    ws.onerror = () => { if (mountedRef.current) setConnected(false); };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        if (data.type === "notification") addNotif(data);
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 4000);
    };
  }, [enabled, addNotif, setConnected]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);
}

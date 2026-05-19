/**
 * useSupportChat — WebSocket ile canlı destek mesajlaşması
 *
 * Kullanım:
 *   const { messages, connected, send } = useSupportChat(ticketId);
 */
import { useEffect, useRef, useState, useCallback } from "react";

export interface ChatMessage {
  id: number;
  message: string;
  sender_id: number;
  sender_name: string;
  is_staff_reply: boolean;
  created_at: string;
}

// Dev'de frontend :5173'te, backend :8000'de çalışır → direkt 8000'e bağlan
// Production'da nginx /ws/ proxy'si üzerinden aynı host:port'tan gider
const isDev = import.meta.env.DEV;
const WS_BASE = isDev
  ? `ws://${window.location.hostname}:8000/ws`
  : `ws://${window.location.host}/ws`;

export function useSupportChat(ticketId: number | null, initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ticket değişince mesajları sıfırla
  useEffect(() => {
    setMessages(initialMessages);
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!ticketId) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Önceki bağlantıyı kapat
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const url = `${WS_BASE}/support/${ticketId}/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => {
            // Duplicate guard
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data as ChatMessage];
          });
        }
      } catch {
        // parse hatası — yoksay
      }
    };

    ws.onerror = () => {
      if (mountedRef.current) setConnected(false);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      // 3 saniye sonra yeniden bağlan
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };
  }, [ticketId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: text }));
    }
  }, []);

  return { messages, connected, send, setMessages };
}

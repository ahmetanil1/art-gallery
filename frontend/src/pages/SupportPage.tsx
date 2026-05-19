import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { supportService } from "../services/supportService";
import { useSupportChat, type ChatMessage } from "../hooks/useSupportChat";
import type { SupportTicket } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  order: "Sipariş", reservation: "Rezervasyon", payment: "Ödeme",
  artwork: "Eser", account: "Hesap", other: "Diğer",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#f39c12", in_progress: "#3498db", resolved: "#27ae60", closed: "#95a5a6",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Açık", in_progress: "İşlemde", resolved: "Çözüldü", closed: "Kapalı",
};

// ── Chat paneli — WebSocket bağlantısını burada yönetiyoruz ──────────────────
function ChatPanel({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mevcut mesajları ChatMessage formatına dönüştür
  const initial: ChatMessage[] = (ticket.messages ?? []).map((m: any) => ({
    id: m.id,
    message: m.message,
    sender_id: m.sender,
    sender_name: m.sender_name || (m.is_staff_reply ? "Destek" : "Siz"),
    is_staff_reply: m.is_staff_reply,
    created_at: m.created_at,
  }));

  const { messages, connected, send } = useSupportChat(ticket.id, initial);

  // Yeni mesaj gelince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (!connected) {
      toast.error("Bağlantı kurulamadı, lütfen bekleyin...");
      return;
    }

    send(text);
    setInput("");
  };

  return (
    <div style={styles.chatPanel}>
      {/* Header */}
      <div style={styles.chatHeader}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.chatTitle}>{ticket.subject}</h3>
          <div style={styles.chatMeta}>
            <span style={{ ...styles.badge, background: STATUS_COLORS[ticket.status] || "#999" }}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
            <span style={{ ...styles.connDot, background: connected ? "#27ae60" : "#e74c3c" }} />
            <span style={styles.connLabel}>{connected ? "Canlı bağlantı" : "Bağlanıyor..."}</span>
          </div>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Mesajlar */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.emptyMsg}>Henüz mesaj yok. İlk mesajı siz gönderin.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.msgRow,
              justifyContent: msg.is_staff_reply ? "flex-start" : "flex-end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", maxWidth: "72%", gap: 3 }}>
              <div
                style={{
                  ...styles.bubble,
                  background: msg.is_staff_reply ? "#f0f4ff" : "#e94560",
                  color: msg.is_staff_reply ? "#1a1a2e" : "#fff",
                  borderRadius: msg.is_staff_reply ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                }}
              >
                {msg.message}
              </div>
              <span style={{ ...styles.msgMeta, textAlign: msg.is_staff_reply ? "left" : "right" }}>
                {msg.is_staff_reply ? `🎧 ${msg.sender_name}` : "👤 Siz"} ·{" "}
                {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {ticket.status !== "closed" ? (
        <form onSubmit={handleSend} style={styles.inputRow}>
          <input
            style={styles.msgInput}
            placeholder={connected ? "Mesajınızı yazın..." : "Bağlanıyor..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!connected}
            autoFocus
          />
          <button style={{ ...styles.sendBtn, opacity: connected ? 1 : 0.5 }} type="submit" disabled={!connected}>
            Gönder
          </button>
        </form>
      ) : (
        <div style={styles.closedNote}>Bu talep kapatılmıştır.</div>
      )}
    </div>
  );
}

// ── Ana sayfa ────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "other" });
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.list();
      setTickets(Array.isArray(data) ? data : data.results);
    } catch {
      toast.error("Destek talepleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportService.create(newTicket);
      toast.success("Destek talebi oluşturuldu!");
      setCreating(false);
      setNewTicket({ subject: "", category: "other" });
      loadTickets();
    } catch {
      toast.error("Talep oluşturulamadı.");
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    try {
      const detail = await supportService.detail(ticket.id);
      setSelected(detail);
    } catch {
      toast.error("Talep yüklenemedi.");
    }
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎧 Müşteri Desteği</h1>
        <button style={styles.newBtn} onClick={() => setCreating(true)}>+ Yeni Talep</button>
      </div>

      {/* Yeni talep formu */}
      {creating && (
        <div style={styles.createCard}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>Yeni Destek Talebi</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              style={styles.formInput}
              placeholder="Konu başlığı"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              required
            />
            <select
              style={styles.formInput}
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.submitBtn} type="submit">Oluştur</button>
              <button style={styles.cancelBtn} type="button" onClick={() => setCreating(false)}>Vazgeç</button>
            </div>
          </form>
        </div>
      )}

      {/* Ana layout */}
      <div style={styles.layout}>
        {/* Sol: Talep listesi */}
        <div style={styles.ticketList}>
          <div style={styles.listHeader}>Taleplerim ({tickets.length})</div>
          {tickets.length === 0 ? (
            <p style={styles.emptyList}>Henüz destek talebiniz yok.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                style={{
                  ...styles.ticketItem,
                  background: selected?.id === t.id ? "#f0f4ff" : "#fff",
                  borderLeft: selected?.id === t.id ? "3px solid #e94560" : "3px solid transparent",
                }}
                onClick={() => handleSelectTicket(t)}
              >
                <div style={styles.ticketTop}>
                  <span style={styles.ticketSubject}>{t.subject}</span>
                  <span style={{ ...styles.statusDot, background: STATUS_COLORS[t.status] || "#999" }} />
                </div>
                <div style={styles.ticketMeta}>
                  <span>{CATEGORY_LABELS[t.category]}</span>
                  <span>{new Date(t.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sağ: Chat paneli */}
        {selected ? (
          <ChatPanel
            key={selected.id}
            ticket={selected}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div style={styles.noChat}>
            <div style={styles.noChatIcon}>💬</div>
            <p>Bir destek talebi seçin</p>
            <span style={{ fontSize: 13, color: "#bbb" }}>Seçtiğinizde canlı bağlantı kurulur</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stiller ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 26, color: "#1a1a2e", margin: 0, fontWeight: 800 },
  newBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  createCard: { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 },
  formInput: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: "100%", boxSizing: "border-box" as const },
  submitBtn: { padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  cancelBtn: { padding: "10px 16px", background: "#eee", color: "#555", border: "none", borderRadius: 8, cursor: "pointer" },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },

  layout: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, height: "calc(100vh - 200px)", minHeight: 500 },

  // Ticket listesi
  ticketList: { background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" },
  listHeader: { padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#888", borderBottom: "1px solid #f0f0f0", textTransform: "uppercase", letterSpacing: 0.5 },
  ticketItem: { padding: "14px 16px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", transition: "background 0.15s" },
  ticketTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  ticketSubject: { fontSize: 14, fontWeight: 600, color: "#1a1a2e", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  ticketMeta: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 4 },
  emptyList: { color: "#bbb", textAlign: "center", padding: 24, fontSize: 14 },

  // Chat paneli
  chatPanel: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" },
  chatHeader: { padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  chatTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chatMeta: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  badge: { color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  connDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  connLabel: { fontSize: 11, color: "#888" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#aaa", padding: "4px 8px", flexShrink: 0 },

  messages: { flex: 1, padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  emptyMsg: { color: "#bbb", textAlign: "center", fontSize: 14, margin: "auto" },
  msgRow: { display: "flex" },
  bubble: { padding: "10px 14px", fontSize: 14, lineHeight: 1.55, wordBreak: "break-word" },
  msgMeta: { fontSize: 11, color: "#bbb" },

  inputRow: { padding: "12px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, flexShrink: 0 },
  msgInput: { flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" },
  sendBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  closedNote: { padding: "12px 20px", textAlign: "center", fontSize: 13, color: "#aaa", borderTop: "1px solid #f0f0f0" },

  // Boş durum
  noChat: { background: "#fff", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#bbb" },
  noChatIcon: { fontSize: 48, marginBottom: 4 },
};

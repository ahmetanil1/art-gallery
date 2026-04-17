import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supportService } from "../services/supportService";
import type { SupportTicket } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  order: "Sipariş", reservation: "Rezervasyon", payment: "Ödeme",
  artwork: "Eser", account: "Hesap", other: "Diğer",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#f39c12", in_progress: "#3498db", resolved: "#27ae60", closed: "#95a5a6",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "other" });
  const [loading, setLoading] = useState(true);

  const load = async () => {
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

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportService.create(newTicket);
      toast.success("Destek talebi oluşturuldu!");
      setCreating(false);
      setNewTicket({ subject: "", category: "other" });
      load();
    } catch {
      toast.error("Talep oluşturulamadı.");
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    const detail = await supportService.detail(ticket.id);
    setSelected(detail);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !newMessage.trim()) return;
    try {
      await supportService.sendMessage(selected.id, newMessage);
      toast.success("Mesaj gönderildi!");
      setNewMessage("");
      handleSelectTicket(selected);
    } catch {
      toast.error("Mesaj gönderilemedi.");
    }
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎧 Müşteri Desteği</h1>
        <button style={styles.newBtn} onClick={() => setCreating(true)}>+ Yeni Talep</button>
      </div>

      {creating && (
        <div style={styles.createForm}>
          <h3>Yeni Destek Talebi</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              style={styles.input}
              placeholder="Konu"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              required
            />
            <select
              style={styles.input}
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

      <div style={styles.layout}>
        {/* Talep listesi */}
        <div style={styles.ticketList}>
          {tickets.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 20 }}>Henüz destek talebiniz yok.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                style={{ ...styles.ticketItem, background: selected?.id === t.id ? "#f0f4ff" : "#fff" }}
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

        {/* Mesajlar */}
        {selected ? (
          <div style={styles.chatPanel}>
            <div style={styles.chatHeader}>
              <h3 style={{ margin: 0 }}>{selected.subject}</h3>
              <span style={{ ...styles.badge, background: STATUS_COLORS[selected.status] || "#999" }}>
                {selected.status}
              </span>
            </div>
            <div style={styles.messages}>
              {selected.messages?.length === 0 ? (
                <p style={{ color: "#999", textAlign: "center" }}>Henüz mesaj yok.</p>
              ) : (
                selected.messages?.map((msg) => (
                  <div key={msg.id} style={{ ...styles.message, alignSelf: msg.is_staff_reply ? "flex-start" : "flex-end" }}>
                    <div style={{ ...styles.bubble, background: msg.is_staff_reply ? "#f0f4ff" : "#e94560", color: msg.is_staff_reply ? "#333" : "#fff" }}>
                      {msg.message}
                    </div>
                    <span style={styles.msgMeta}>
                      {msg.is_staff_reply ? "🎧 Destek" : "👤 Siz"} · {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
            {selected.status !== "closed" && (
              <form onSubmit={handleSendMessage} style={styles.messageForm}>
                <input
                  style={styles.messageInput}
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required
                />
                <button style={styles.sendBtn} type="submit">Gönder</button>
              </form>
            )}
          </div>
        ) : (
          <div style={styles.noChat}>
            <p>Bir destek talebi seçin</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28, color: "#1a1a2e", margin: 0 },
  newBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  createForm: { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 },
  input: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, width: "100%", boxSizing: "border-box" as const },
  submitBtn: { padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  cancelBtn: { padding: "10px 16px", background: "#eee", color: "#555", border: "none", borderRadius: 8, cursor: "pointer" },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  layout: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, height: 600 },
  ticketList: { background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  ticketItem: { padding: "14px 16px", borderBottom: "1px solid #f0f0f0", cursor: "pointer" },
  ticketTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ticketSubject: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  ticketMeta: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginTop: 4 },
  chatPanel: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" },
  chatHeader: { padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12 },
  messages: { flex: 1, padding: 20, overflow: "auto", display: "flex", flexDirection: "column", gap: 12 },
  message: { display: "flex", flexDirection: "column", maxWidth: "70%" },
  bubble: { padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5 },
  msgMeta: { fontSize: 11, color: "#aaa", marginTop: 4 },
  messageForm: { padding: "12px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 },
  messageInput: { flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  sendBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  noChat: { background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 16 },
};

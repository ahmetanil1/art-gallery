import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { orderService } from "../services/orderService";
import type { Order } from "../types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "#f39c12" },
  paid: { label: "Ödendi", color: "#27ae60" },
  shipped: { label: "Kargoda", color: "#3498db" },
  delivered: { label: "Teslim Edildi", color: "#2ecc71" },
  cancelled: { label: "İptal", color: "#e74c3c" },
  refunded: { label: "İade Edildi", color: "#95a5a6" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.list()
      .then((data: Order[] | { results: Order[] }) => setOrders(Array.isArray(data) ? data : (data as { results: Order[] }).results))
      .catch(() => toast.error("Siparişler yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🛒 Siparişlerim</h1>

      {orders.length === 0 ? (
        <div style={styles.empty}>Henüz siparişiniz yok.</div>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => {
            const st = STATUS_LABELS[order.status] || { label: order.status, color: "#999" };
            return (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.orderId}>Sipariş #{order.id}</h3>
                    <p style={styles.date}>{new Date(order.created_at).toLocaleString("tr-TR")}</p>
                  </div>
                  <span style={{ ...styles.badge, background: st.color }}>{st.label}</span>
                </div>

                <div style={styles.items}>
                  {order.items?.map((item) => (
                    <div key={item.id} style={styles.item}>
                      <span style={styles.itemName}>{item.artwork_detail?.title || `Eser #${item.artwork}`}</span>
                      <span style={styles.itemQty}>x{item.quantity}</span>
                      <span style={styles.itemPrice}>₺{Number(item.subtotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.footer}>
                  {order.discount_amount && Number(order.discount_amount) > 0 && (
                    <span style={styles.discount}>
                      İndirim: -₺{Number(order.discount_amount).toLocaleString()}
                    </span>
                  )}
                  <span style={styles.total}>
                    Toplam: ₺{Number(order.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  empty: { textAlign: "center", padding: 60, color: "#999", fontSize: 16 },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  orderId: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  date: { fontSize: 12, color: "#aaa", marginTop: 4 },
  badge: { color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  items: { borderTop: "1px solid #f0f0f0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 },
  item: { display: "flex", alignItems: "center", gap: 12, fontSize: 14 },
  itemName: { flex: 1, color: "#333" },
  itemQty: { color: "#888", fontSize: 13 },
  itemPrice: { fontWeight: 600, color: "#1a1a2e" },
  footer: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" },
  discount: { fontSize: 13, color: "#27ae60" },
  total: { fontSize: 18, fontWeight: 700, color: "#e94560" },
};

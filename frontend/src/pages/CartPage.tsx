import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

const PAYMENT_METHODS = [
  { value: "credit_card", label: "💳 Kredi Kartı" },
  { value: "debit_card", label: "🏦 Banka Kartı" },
  { value: "bank_transfer", label: "🔄 Havale/EFT" },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    items, item_count, subtotal, coupon_code, discount_amount, total_after_discount,
    loading, fetchCart, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, checkout,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [shippingAddress, setShippingAddress] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const result = await applyCoupon(couponInput.trim().toUpperCase());
      toast.success(`Kupon uygulandı! %${result.discount_rate} indirim`);
      setCouponInput("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Geçersiz kupon.");
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    toast.success("Kupon kaldırıldı.");
  };

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Teslimat adresi giriniz.");
      return;
    }
    setCheckingOut(true);
    try {
      await checkout(paymentMethod, shippingAddress);
      toast.success("Siparişiniz başarıyla oluşturuldu! 🎉");
      navigate(`/orders`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Sipariş oluşturulamadı.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.empty}>
        <p>Sepeti görüntülemek için giriş yapmalısınız.</p>
        <Link to="/login" style={styles.btn}>Giriş Yap</Link>
      </div>
    );
  }

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🛒 Sepetim {item_count > 0 && <span style={styles.badge}>{item_count}</span>}</h1>

      {items.length === 0 ? (
        <div style={styles.emptyCart}>
          <div style={styles.emptyIcon}>🛒</div>
          <h2>Sepetiniz boş</h2>
          <p>Beğendiğiniz eserleri sepete ekleyin.</p>
          <Link to="/artworks" style={styles.btn}>Eserlere Göz At</Link>
        </div>
      ) : (
        <div style={styles.layout}>
          {/* Sol: Ürünler */}
          <div style={styles.itemsSection}>
            <div style={styles.itemsHeader}>
              <span>{item_count} ürün</span>
              <button style={styles.clearBtn} onClick={() => { clearCart(); toast.success("Sepet temizlendi."); }}>
                🗑️ Sepeti Temizle
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} style={styles.cartItem}>
                <div style={styles.itemImg}>
                  {item.artwork_detail.primary_image
                    ? <img src={item.artwork_detail.primary_image} alt={item.artwork_detail.title} style={styles.img} />
                    : <span style={{ fontSize: 32 }}>🖼️</span>}
                </div>
                <div style={styles.itemInfo}>
                  <Link to={`/artworks/${item.artwork_detail.id}`} style={styles.itemTitle}>
                    {item.artwork_detail.title}
                  </Link>
                  <p style={styles.itemArtist}>👨‍🎨 {item.artwork_detail.artist_name}</p>
                  <p style={styles.itemPrice}>₺{Number(item.artwork_detail.price).toLocaleString()}</p>
                </div>
                <div style={styles.itemActions}>
                  <div style={styles.qtyControl}>
                    <button style={styles.qtyBtn} onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                    <span style={styles.qty}>{item.quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <p style={styles.subtotal}>₺{Number(item.subtotal).toLocaleString()}</p>
                  <button style={styles.removeBtn} onClick={() => { removeItem(item.id); toast.success("Sepetten çıkarıldı."); }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sağ: Özet */}
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Sipariş Özeti</h2>

            {/* Kupon */}
            {coupon_code ? (
              <div style={styles.couponApplied}>
                <span>🎟️ <strong>{coupon_code}</strong> uygulandı</span>
                <button style={styles.removeCouponBtn} onClick={handleRemoveCoupon}>✕</button>
              </div>
            ) : (
              <div style={styles.couponBox}>
                <input
                  style={styles.couponInput}
                  placeholder="İndirim kodu"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                />
                <button style={styles.couponBtn} onClick={handleApplyCoupon}>Uygula</button>
              </div>
            )}

            <div style={styles.priceRows}>
              <div style={styles.priceRow}>
                <span>Ara Toplam</span>
                <span>₺{Number(subtotal).toLocaleString()}</span>
              </div>
              {discount_amount > 0 && (
                <div style={{ ...styles.priceRow, color: "#27ae60" }}>
                  <span>İndirim</span>
                  <span>-₺{Number(discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div style={styles.totalRow}>
                <span>Toplam</span>
                <span style={styles.totalAmount}>₺{Number(total_after_discount).toLocaleString()}</span>
              </div>
            </div>

            {step === "cart" ? (
              <button style={styles.checkoutBtn} onClick={() => setStep("checkout")}>
                Ödemeye Geç →
              </button>
            ) : (
              <div style={styles.checkoutForm}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Ödeme Bilgileri</h3>
                <label style={styles.label}>Ödeme Yöntemi</label>
                <div style={styles.paymentMethods}>
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.value} style={{ ...styles.paymentOption, background: paymentMethod === m.value ? "#f0f4ff" : "#fff", borderColor: paymentMethod === m.value ? "#3498db" : "#ddd" }}>
                      <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} style={{ marginRight: 8 }} />
                      {m.label}
                    </label>
                  ))}
                </div>
                <label style={styles.label}>Teslimat Adresi</label>
                <textarea
                  style={styles.textarea}
                  placeholder="Adresinizi girin..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  required
                />
                <button style={styles.checkoutBtn} onClick={handleCheckout} disabled={checkingOut}>
                  {checkingOut ? "İşleniyor..." : `₺${Number(total_after_discount).toLocaleString()} Öde`}
                </button>
                <button style={styles.backBtn} onClick={() => setStep("cart")}>← Geri</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 },
  badge: { background: "#e94560", color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
  loading: { textAlign: "center", padding: 80, color: "#999" },
  empty: { textAlign: "center", padding: 80 },
  emptyCart: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  btn: { display: "inline-block", marginTop: 16, padding: "12px 28px", background: "#e94560", color: "#fff", textDecoration: "none", borderRadius: 8, fontWeight: 600 },
  layout: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" },
  itemsSection: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  itemsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" },
  clearBtn: { background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 13 },
  cartItem: { display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid #f5f5f5", alignItems: "center" },
  itemImg: { width: 80, height: 80, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", textDecoration: "none", display: "block", marginBottom: 4 },
  itemArtist: { fontSize: 12, color: "#888", margin: "0 0 4px" },
  itemPrice: { fontSize: 14, color: "#666", margin: 0 },
  itemActions: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 },
  qtyControl: { display: "flex", alignItems: "center", gap: 8, background: "#f5f5f5", borderRadius: 8, padding: "4px 8px" },
  qtyBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#333", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: "center" },
  subtotal: { fontSize: 16, fontWeight: 700, color: "#e94560", margin: 0 },
  removeBtn: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16 },
  summary: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 80 },
  summaryTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 20 },
  couponBox: { display: "flex", gap: 8, marginBottom: 16 },
  couponInput: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, letterSpacing: 1 },
  couponBtn: { padding: "10px 16px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  couponApplied: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eafaf1", border: "1px solid #a9dfbf", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  removeCouponBtn: { background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 16 },
  priceRows: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  priceRow: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555" },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, paddingTop: 12, borderTop: "2px solid #f0f0f0" },
  totalAmount: { color: "#e94560" },
  checkoutBtn: { width: "100%", padding: "14px", background: "#e94560", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, cursor: "pointer", fontWeight: 700, marginBottom: 8 },
  backBtn: { width: "100%", padding: "10px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  checkoutForm: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  paymentMethods: { display: "flex", flexDirection: "column", gap: 8 },
  paymentOption: { display: "flex", alignItems: "center", padding: "10px 14px", border: "2px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  textarea: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical" },
};

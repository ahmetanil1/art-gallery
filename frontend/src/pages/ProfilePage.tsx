import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useAuthStore } from "../store/authStore";

export default function ProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", address: "" });
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", new_password2: "" });
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name, last_name: user.last_name, phone: user.phone, address: user.address });
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/auth/profile/", form);
      await fetchProfile();
      toast.success("Profil güncellendi!");
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/auth/change-password/", pwForm);
      toast.success("Şifre değiştirildi!");
      setPwForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err: any) {
      const errors = err.response?.data;
      toast.error(errors ? Object.values(errors).flat().join(" ") : "Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatar}>
          {user?.first_name?.[0]?.toUpperCase() || "👤"}
        </div>
        <h2 style={styles.name}>{user?.first_name} {user?.last_name}</h2>
        <p style={styles.email}>{user?.email}</p>
        <span style={styles.role}>{user?.role === "admin" ? "🔑 Yönetici" : user?.role === "gallery_manager" ? "🎨 Galeri Yöneticisi" : "👤 Müşteri"}</span>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(tab === "profile" ? styles.activeTab : {}) }} onClick={() => setTab("profile")}>Profil Bilgileri</button>
          <button style={{ ...styles.tab, ...(tab === "password" ? styles.activeTab : {}) }} onClick={() => setTab("password")}>Şifre Değiştir</button>
        </div>

        {tab === "profile" ? (
          <form onSubmit={handleProfileSave} style={styles.form}>
            {[
              { name: "first_name", label: "Ad" },
              { name: "last_name", label: "Soyad" },
              { name: "phone", label: "Telefon" },
            ].map((f) => (
              <div key={f.name}>
                <label style={styles.label}>{f.label}</label>
                <input
                  style={styles.input}
                  value={form[f.name as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label style={styles.label}>Adres</label>
              <textarea
                style={{ ...styles.input, resize: "vertical" }}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
              />
            </div>
            <button style={styles.btn} type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} style={styles.form}>
            {[
              { name: "old_password", label: "Mevcut Şifre" },
              { name: "new_password", label: "Yeni Şifre" },
              { name: "new_password2", label: "Yeni Şifre Tekrar" },
            ].map((f) => (
              <div key={f.name}>
                <label style={styles.label}>{f.label}</label>
                <input
                  style={styles.input}
                  type="password"
                  value={pwForm[f.name as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [f.name]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button style={styles.btn} type="submit" disabled={saving}>
              {saving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", padding: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: 440, textAlign: "center" },
  avatar: { width: 80, height: 80, borderRadius: "50%", background: "#e94560", color: "#fff", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  name: { fontSize: 22, color: "#1a1a2e", margin: "0 0 4px" },
  email: { color: "#888", fontSize: 14, margin: "0 0 8px" },
  role: { fontSize: 12, background: "#f0f4ff", color: "#3498db", padding: "3px 10px", borderRadius: 20 },
  tabs: { display: "flex", gap: 0, marginTop: 24, borderBottom: "2px solid #f0f0f0" },
  tab: { flex: 1, padding: "10px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888" },
  activeTab: { color: "#e94560", borderBottom: "2px solid #e94560", fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 12, marginTop: 20, textAlign: "left" },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btn: { padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 600, marginTop: 4 },
};

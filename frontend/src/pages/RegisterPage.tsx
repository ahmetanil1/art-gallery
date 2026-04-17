import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "", email: "", first_name: "", last_name: "",
    phone: "", password: "", password2: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register/", form);
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (err: any) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(" ") : "Kayıt başarısız.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields: { name: keyof typeof form; label: string; type: string }[] = [
    { name: "username", label: "Kullanıcı Adı", type: "text" },
    { name: "email", label: "E-posta", type: "email" },
    { name: "first_name", label: "Ad", type: "text" },
    { name: "last_name", label: "Soyad", type: "text" },
    { name: "phone", label: "Telefon", type: "text" },
    { name: "password", label: "Şifre", type: "password" },
    { name: "password2", label: "Şifre Tekrar", type: "password" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Kayıt Ol</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map((f) => (
            <div key={f.name}>
              <label style={styles.label}>{f.label}</label>
              <input
                style={styles.input}
                name={f.name}
                type={f.type}
                value={form[f.name]}
                onChange={handleChange}
                required={f.name !== "phone"}
              />
            </div>
          ))}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>
        <p style={styles.footer}>
          Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", padding: 20 },
  card: { background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: 420 },
  title: { textAlign: "center", marginBottom: 24, color: "#1a1a2e" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btn: { marginTop: 8, padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 600 },
  footer: { textAlign: "center", marginTop: 16, fontSize: 13, color: "#666" },
};

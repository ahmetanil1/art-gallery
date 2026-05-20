import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = () => {
    const token = localStorage.getItem("access_token");
    fetch("http://localhost:8000/api/reservations/", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setReservations(data.results || data);
    })
    .catch(() => toast.error("Rezervasyonlar yüklenemedi."))
    .finally(() => setLoading(false));
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/api/reservations/${id}/`, {
        method: 'PATCH',
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      toast.success("Rezervasyon durumu güncellendi");
      fetchReservations();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, fontSize: 18, color: "#999" }}>Yükleniyor...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>Rezervasyon Yönetimi</h2>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            <th style={{ padding: 12, borderBottom: "2px solid #ddd" }}>ID</th>
            <th style={{ padding: 12, borderBottom: "2px solid #ddd" }}>Etkinlik</th>
            <th style={{ padding: 12, borderBottom: "2px solid #ddd" }}>Durum</th>
            <th style={{ padding: 12, borderBottom: "2px solid #ddd" }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 12 }}>#{r.id}</td>
              <td style={{ padding: 12 }}>{r.event?.title || `Event ${r.event}`}</td>
              <td style={{ padding: 12 }}>{r.status}</td>
              <td style={{ padding: 12 }}>
                <select 
                  value={r.status} 
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onayla</option>
                  <option value="cancelled">İptal Et</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
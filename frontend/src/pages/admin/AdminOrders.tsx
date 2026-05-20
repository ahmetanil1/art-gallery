import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    const token = localStorage.getItem("access_token");
    fetch("http://localhost:8000/api/orders/", {
           headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setOrders(data.results || data);
    })
    .catch(() => toast.error("Siparişler yüklenemedi."))
    .finally(() => setLoading(false));
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${id}/`, {
        method: 'PATCH',
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      toast.success("Sipariş durumu güncellendi");
      fetchOrders();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h2>Sipariş Yönetimi</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            <th style={{ padding: 12 }}>ID</th>
            <th style={{ padding: 12 }}>Kullanıcı</th>
            <th style={{ padding: 12 }}>Tutar</th>
            <th style={{ padding: 12 }}>Durum</th>
            <th style={{ padding: 12 }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: 12 }}>#{o.id}</td>
              <td style={{ padding: 12 }}>{o.user?.email || `User ${o.user}`}</td>
              <td style={{ padding: 12 }}>₺{o.total_amount}</td>
              <td style={{ padding: 12 }}>{o.status}</td>
              <td style={{ padding: 12 }}>
                <select 
                  value={o.status} 
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  style={{ padding: 6, borderRadius: 4 }}
                >
                  <option value="pending">Beklemede</option>
                  <option value="paid">Onayla (Ödendi)</option>
                  <option value="shipped">Kargola</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal Et</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
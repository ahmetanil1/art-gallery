import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !["admin", "gallery_manager"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }: { children: JSX.Element }) {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
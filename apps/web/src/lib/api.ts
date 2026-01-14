import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = localStorage.getItem("orgId");
  if (orgId) {
    config.headers = config.headers ?? {};
    // ✅ workspace header
    config.headers["x-org-id"] = orgId;
  }

  return config;
});
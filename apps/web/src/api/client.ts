import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
});

// ===============================
// Request interceptor
// ===============================
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete (config.headers as any).Authorization;
  }

  const orgId = localStorage.getItem("orgId");
  if (orgId) {
    config.headers["x-org-id"] = orgId;
  }

  return config;
});


// Response interceptor 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Token geçersiz / expired / unauthorized
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      // orgId'yi istersen silme (workspace hatırlansın)
      // localStorage.removeItem("orgId");

      // Login route'un sende farklıysa değiştir
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
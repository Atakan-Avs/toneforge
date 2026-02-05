import axios from "axios";

// Determine API URL based on environment
function getApiUrl(): string {
  // If environment variable is set, use it (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (not localhost), use the same origin
  // This assumes API is served from the same origin (e.g., via nginx reverse proxy)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
    
    if (!isLocalhost) {
      // Production: use same origin (API should be on same domain/port)
      // For mobile devices, this will use the same origin as the web app
      return window.location.origin;
    }
  }
  
  // Default to localhost for development
  return "http://localhost:4000";
}

const baseURL = getApiUrl();

// Log API URL in development for debugging (remove in production if needed)
if (import.meta.env.DEV) {
  console.log("[API Client] Base URL:", baseURL);
}

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 second timeout for mobile networks
  headers: {
    "Content-Type": "application/json",
  },
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
    // Enhanced error logging for debugging (especially on mobile)
    if (import.meta.env.DEV) {
      console.error("[API Error]", {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        method: error?.config?.method,
      });
    }

    const status = error?.response?.status;
    const isNetworkError = !error?.response && error?.message;

    // Network errors (no response) - common on mobile
    if (isNetworkError) {
      // Check if it's a timeout
      if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
        error.message = "Request timeout. Please check your connection and try again.";
      } else if (error?.message?.includes("Network Error") || error?.message?.includes("Failed to fetch")) {
        error.message = "Network error. Please check your internet connection.";
      } else {
        error.message = error?.message || "Network error. Please try again.";
      }
    }

    if (status === 401) {
      // Token geçersiz / expired / unauthorized
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      // orgId'yi istersen silme (workspace hatırlansın)
      // localStorage.removeItem("orgId");

      // Login route'un sende farklıysa değiştir
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
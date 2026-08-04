const normalizeBaseUrl = (url) => {
  if (!url || url === "undefined" || url === "null") return "";
  return url.replace(/\/+$/, "");
};

const getDefaultBaseUrl = () => {
  if (import.meta.env.DEV) return "http://localhost:5000";
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_BACKEND_URL || getDefaultBaseUrl()
);

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const isLocalBackend =
  API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");

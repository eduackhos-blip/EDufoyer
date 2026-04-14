const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";

export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
  if (!path) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

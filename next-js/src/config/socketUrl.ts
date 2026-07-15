/**
 * Public Socket.IO base URL for the browser client.
 * Prefer NEXT_PUBLIC_SOCKET_URL; fall back by environment.
 */
export const PRODUCTION_SOCKET_URL = "https://socket-server-steel.vercel.app";

export function getPublicSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") return PRODUCTION_SOCKET_URL;
  return "http://localhost:4001";
}

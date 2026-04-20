import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  username: string;
  email: string;
};

function parseAuthUserFromToken(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("token");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: String(payload.userId ?? payload.id ?? payload._id ?? ""),
      username: String(payload.username ?? payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => parseAuthUserFromToken());

  useEffect(() => {
    const sync = () => setUser(parseAuthUserFromToken());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return { user, isAuthenticated: Boolean(user) };
}

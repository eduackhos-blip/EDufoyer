"use client";

import { useMemo } from "react";

export type SessionUser = {
  id: string;
  userId: string;
  username: string;
  email: string;
};

function parseUserFromToken(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("token");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const id = String(payload.userId ?? payload.id ?? payload._id ?? "");

    return {
      id,
      userId: id,
      username: String(payload.username ?? payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

export function useCurrentSessionUser() {
  return useMemo(() => parseUserFromToken(), []);
}

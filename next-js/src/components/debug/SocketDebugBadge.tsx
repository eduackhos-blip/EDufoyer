"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/src/contexts/SocketContext";

const getSocketUrl = () =>
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || "http://localhost:4001";

export function SocketDebugBadge() {
  const { isConnected, socketId, socket, connectSocket } = useSocket();
  const [hasToken, setHasToken] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const sync = () => setHasToken(Boolean(window.localStorage.getItem("token")));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const activeSocket = socket ?? connectSocket();
  const displaySocketId = socketId ?? activeSocket?.id ?? "—";
  const transport = activeSocket?.io?.engine?.transport?.name ?? "—";
  const status = !hasToken ? "no-token" : isConnected ? "connected" : "disconnected";

  const statusStyles =
    status === "connected"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : status === "no-token"
        ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
        : "bg-red-500/20 text-red-300 border-red-500/40";

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] font-mono text-[11px] leading-tight"
      data-testid="socket-debug-badge"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg backdrop-blur-md transition ${statusStyles}`}
        aria-expanded={expanded}
        aria-label="Socket connection debug"
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            status === "connected"
              ? "bg-emerald-400 animate-pulse"
              : status === "no-token"
                ? "bg-amber-400"
                : "bg-red-400"
          }`}
        />
        <span className="font-semibold uppercase tracking-wide">
          Socket: {status === "connected" ? "ON" : status === "no-token" ? "NO TOKEN" : "OFF"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-2 w-[min(100vw-2rem,280px)] rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-slate-300 shadow-xl">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Debug</p>
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">URL</dt>
              <dd className="truncate text-right text-slate-200">{getSocketUrl()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Socket ID</dt>
              <dd className="truncate text-right text-slate-200">{displaySocketId}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Transport</dt>
              <dd className="text-right text-slate-200">{transport}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Auth token</dt>
              <dd className="text-right text-slate-200">{hasToken ? "present" : "missing"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">connected</dt>
              <dd className="text-right text-slate-200">{String(activeSocket?.connected ?? false)}</dd>
            </div>
          </dl>
          {!hasToken ? (
            <p className="mt-2 text-[10px] text-amber-300/90">Log in to connect the socket.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { SocketProvider } from "@/src/contexts/SocketContext";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import { SocketDebugBadge } from "@/src/components/debug/SocketDebugBadge";

const showSocketDebug =
  process.env.NEXT_PUBLIC_SOCKET_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>
        {children}
        {showSocketDebug ? <SocketDebugBadge /> : null}
        <Toaster position="top-right" />
      </SocketProvider>
    </ThemeProvider>
  );
}

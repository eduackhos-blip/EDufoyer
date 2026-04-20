"use client";

import type { ReactNode } from "react";
import { SocketProvider } from "@/src/contexts/SocketContext";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SocketProvider>
        {children}
        <Toaster position="top-right" />
      </SocketProvider>
    </ThemeProvider>
  );
}

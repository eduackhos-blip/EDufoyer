"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/src/contexts/ThemeContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

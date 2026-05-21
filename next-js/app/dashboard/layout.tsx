"use client";

import { Suspense, type ReactNode } from "react";
import SolverIncomingDoubtHost from "@/src/components/solver/SolverIncomingDoubtHost";
import DashboardContentLoading from "@/src/components/dashboard/DashboardContentLoading";
import { DashboardAuthProvider } from "@/src/contexts/DashboardAuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--dash-mint,#e8f5e9)]">
          <DashboardContentLoading message="Loading…" />
        </div>
      }
    >
      <DashboardAuthProvider>
        <SolverIncomingDoubtHost />
        {children}
      </DashboardAuthProvider>
    </Suspense>
  );
}

"use client";

import dynamic from "next/dynamic";
import DashboardRouteLoading from "@/src/components/dashboard/DashboardRouteLoading";

const Screen = dynamic(() => import("@/src/components/DoubtManagement"), {
  ssr: false,
  loading: () => <DashboardRouteLoading />,
});

export default function Page() {
  return <Screen />;
}

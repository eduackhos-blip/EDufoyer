"use client";

import dynamic from "next/dynamic";

const Screen = dynamic(() => import("@/src/components/UniversityAdminLogin"), { ssr: false });

export default function Page() {
  return <Screen />;
}

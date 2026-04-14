"use client";

import dynamic from "next/dynamic";

const Screen = dynamic(() => import("@/src/components/JoinPyqRoom"), { ssr: false });

export default function Page() {
  return <Screen />;
}

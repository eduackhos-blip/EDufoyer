"use client";

import Link from "next/link";
import { Clock, Home } from "lucide-react";

type SessionRoomUnavailableProps = {
  title?: string;
  message?: string;
};

export function SessionRoomUnavailable({
  title = "This session link is no longer valid",
  message = "This meeting room may have expired, ended, or the link is incorrect. Ask for a new session link from your doubt page or dashboard.",
}: SessionRoomUnavailableProps) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <Clock className="h-7 w-7 text-amber-400" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Home className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

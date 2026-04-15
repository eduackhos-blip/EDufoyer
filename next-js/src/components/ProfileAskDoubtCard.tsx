import React, { useState } from 'react';
import { MessageCircle, Send, Lightbulb, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AskDoubt from './AskDoubt';

const ProfileAskDoubtCard = () => {
  const router = useRouter();
  const [externalOpenSignal, setExternalOpenSignal] = useState(0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden flex flex-col h-full min-h-[380px]">
      {/* Header — solid blue, tagline stays in header per screenshot */}
      <div className="relative shrink-0 overflow-hidden rounded-t-2xl bg-[#3b82f6] px-5 pt-5 pb-6">
        <Sparkles
          className="pointer-events-none absolute -right-4 -top-2 h-28 w-28 text-sky-200/35"
          strokeWidth={1}
          aria-hidden
        />
        <div className="relative z-10 flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-300/45"
            aria-hidden
          >
            <MessageCircle className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-bold tracking-tight text-white">Ask a Doubt</h3>
            <p className="mt-2 text-sm font-normal leading-relaxed text-white/95">
              Stuck on something? Get instant help from our expert community! 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pb-6 pt-6 md:px-6">
        <h4 className="text-base font-bold text-gray-900 dark:text-white">How can we help?</h4>
        <p className="mt-2 text-sm font-normal leading-relaxed text-gray-500 dark:text-gray-400">
          Choose the type of assistance you need. We&apos;re here to make learning easier!
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setExternalOpenSignal((prev) => prev + 1)}
            className="group flex w-full items-stretch gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 text-left shadow-sm transition hover:from-blue-700 hover:to-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl bg-sky-300/35">
              <Send className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="text-base font-bold text-white">Ask a Question?</span>
              <span className="mt-1 text-sm font-normal text-white/90">
                Post your doubt and get expert answers
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/doubts?tab=available')}
            className="group flex w-full items-stretch gap-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 px-4 py-4 text-left shadow-sm transition hover:from-purple-700 hover:via-fuchsia-600 hover:to-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl bg-white/25">
              <Lightbulb className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="text-base font-bold text-white">Solver Request</span>
              <span className="mt-1 text-sm font-normal text-white/90">
                Request dedicated help from top solvers
              </span>
            </div>
          </button>
        </div>
      </div>

      <AskDoubt hideTrigger externalOpenSignal={externalOpenSignal} />
    </div>
  );
};

export default ProfileAskDoubtCard;

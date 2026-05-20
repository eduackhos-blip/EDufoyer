import React, { useState } from 'react';
import { MessageCircle, Send, Lightbulb, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AskDoubt from './AskDoubt';

const ProfileAskDoubtCard = () => {
  const router = useRouter();
  const [externalOpenSignal, setExternalOpenSignal] = useState(0);

  return (
    <div className="dash-panel-card flex h-full min-h-[380px] flex-col overflow-hidden">
      <div className="relative shrink-0 overflow-hidden rounded-t-[22px] bg-[#073E36] px-5 pb-6 pt-5">
        <Sparkles
          className="pointer-events-none absolute -right-4 -top-2 h-28 w-28 text-white/15"
          strokeWidth={1}
          aria-hidden
        />
        <div className="relative z-10 flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15"
            aria-hidden
          >
            <MessageCircle className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-bold tracking-tight text-white">Ask a Doubt</h3>
            <p className="mt-2 text-sm font-normal leading-relaxed text-white/95">
              Stuck on something? Get instant help from our expert community!
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-6 md:px-6">
        <h4 className="text-base font-bold text-[var(--dash-forest)]">How can we help?</h4>
        <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--dash-text-muted)]">
          Choose the type of assistance you need. We&apos;re here to make learning easier!
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setExternalOpenSignal((prev) => prev + 1)}
            className="group flex w-full items-stretch gap-4 rounded-2xl bg-[#073E36] px-4 py-4 text-left shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dash-forest)]/30 focus-visible:ring-offset-2"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl bg-white/15">
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
            className="group flex w-full items-stretch gap-4 rounded-2xl border-2 border-[var(--dash-forest)] bg-white px-4 py-4 text-left shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dash-forest)]/20 focus-visible:ring-offset-2"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-xl bg-[var(--dash-card-mint)]">
              <Lightbulb className="h-5 w-5 text-[var(--dash-forest)]" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="text-base font-bold text-[var(--dash-forest)]">Browse available doubts</span>
              <span className="mt-1 text-sm font-normal text-[var(--dash-text-body)]">
                See doubts you can help with as a solver
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

import { useEffect } from "react";

export type LeaveCallModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  /** Solver leaving ends the session permanently for this room. */
  variant?: "default" | "solver";
};

const COPY = {
  default: {
    title: "Leave call?",
    message:
      "Are you sure you want to leave? Your WebRTC connection will end and you will return to the dashboard.",
    confirmLabel: "Yes, leave",
  },
  solver: {
    title: "Leave meeting?",
    message:
      "If you leave, this session will end and you will no longer be able to join it.",
    confirmLabel: "Leave",
  },
} as const;

export function LeaveCallModal({ onCancel, onConfirm, variant = "default" }: LeaveCallModalProps) {
  const copy = COPY[variant];
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="leave-call-title">
      <button type="button" aria-label="Dismiss" className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/40">
        <h3 id="leave-call-title" className="text-lg font-semibold text-slate-100">
          {copy.title}
        </h3>
        <p className="mt-2 text-sm text-slate-400">{copy.message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
          >
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

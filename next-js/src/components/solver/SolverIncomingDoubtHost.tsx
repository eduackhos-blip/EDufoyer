"use client";

import { usePathname } from "next/navigation";
import SolverAvailableDoubtModal from "@/src/components/solver/SolverAvailableDoubtModal";
import { useSolverIncomingDoubt } from "@/src/hooks/useSolverIncomingDoubt";

/** True on dashboard routes where solvers should see the global accept/join popup. */
function shouldShowSolverDoubtPopup(pathname: string | null) {
  if (!pathname?.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/dashboard/session")) return false;
  return true;
}

export default function SolverIncomingDoubtHost() {
  const pathname = usePathname();
  const enabled = shouldShowSolverDoubtPopup(pathname);

  const { isSolver, showModal, incomingDoubt, isJoining, acceptAndJoin, dismiss, ratedToast } =
    useSolverIncomingDoubt(enabled);

  return (
    <>
      {ratedToast ? (
        <div
          className="fixed right-4 top-4 z-[70] rounded-xl px-4 py-3 text-white shadow-lg"
          style={{ backgroundColor: "var(--dash-forest)" }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-white/80" />
            {ratedToast}
          </div>
        </div>
      ) : null}
      {isSolver && showModal && incomingDoubt ? (
        <SolverAvailableDoubtModal
          doubt={incomingDoubt}
          isJoining={isJoining}
          onAccept={acceptAndJoin}
          onDismiss={dismiss}
        />
      ) : null}
    </>
  );
}

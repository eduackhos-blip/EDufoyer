"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/src/services/authService";
import { useSocket } from "@/src/contexts/SocketContext";
import { incomingDoubtFromPayload, type IncomingDoubt } from "@/src/types/incomingDoubt";
import { isDashboardSolver } from "@/src/utils/dashboardUserUtils";

const POLL_MS = 15_000;

export function useSolverIncomingDoubt(enabled: boolean) {
  const router = useRouter();
  const { socket: sharedSocket, connectSocket } = useSocket();
  const [user, setUser] = useState<{ isSolver?: boolean } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [incomingDoubt, setIncomingDoubt] = useState<IncomingDoubt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [ratedToast, setRatedToast] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenAvailableIdsRef = useRef(new Set<string>());

  const isSolver = isDashboardSolver(user);

  useEffect(() => {
    if (!enabled) {
      setAuthReady(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (!authService.isAuthenticated()) return;
        if (localStorage.getItem("cacheVerified") !== "true") return;
        const profile = await authService.getProfile();
        if (!cancelled) {
          setUser(profile);
          setAuthReady(true);
        }
      } catch {
        if (!cancelled) setAuthReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const dismiss = useCallback(() => {
    if (isJoining) return;
    setShowModal(false);
    setIncomingDoubt(null);
  }, [isJoining]);

  const showIncoming = useCallback((doubt: IncomingDoubt) => {
    setIncomingDoubt(doubt);
    setShowModal(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("edu:doubt-available", { detail: { doubtId: doubt.doubtId } })
      );
    }
  }, []);

  const acceptAndJoin = useCallback(async () => {
    if (!incomingDoubt) return;
    setIsJoining(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/solver/accept-doubt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doubtId: incomingDoubt.doubtId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to accept doubt");
      }

      const sessionRoomId = data?.data?.roomId;
      if (!sessionRoomId) {
        throw new Error("Accept succeeded but session room id was missing.");
      }

      await new Promise((r) => setTimeout(r, 1200));

      if (incomingDoubt.is_scheduled && incomingDoubt.scheduled_date) {
        setShowModal(false);
        setIncomingDoubt(null);
        alert(
          "Doubt accepted successfully! You will receive an email with the meeting link at the scheduled time."
        );
        return;
      }

      setShowModal(false);
      setIncomingDoubt(null);
      router.push(`/dashboard/session/${encodeURIComponent(sessionRoomId)}`);
    } catch (error) {
      console.error("Accept doubt failed:", error);
    } finally {
      setIsJoining(false);
    }
  }, [incomingDoubt, router]);

  useEffect(() => {
    if (!enabled || !authReady || !isSolver) return;

    let onDoubtAvailable: ((payload: Record<string, unknown>) => void) | null = null;
    let onDoubtAssigned: ((payload: { doubtId?: string }) => void) | null = null;
    let onDoubtRated: ((payload: { doubtId?: string; rating?: number }) => void) | null = null;
    let onSocketConnect: (() => void) | null = null;

    const registerAsSolver = (socket: NonNullable<ReturnType<typeof connectSocket>>) => {
      void (async () => {
        try {
          const profile = await authService.getProfile();
          const userId = profile?.id || profile?._id;
          let subjects: string[] = [];
          try {
            const profRes = await fetch("/api/profile", {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const profJson = await profRes.json();
            const strongSubject = profJson?.data?.strongSubject;
            subjects = strongSubject ? [String(strongSubject).toLowerCase()] : [];
          } catch {
            /* ignore */
          }
          socket.emit("registerSolver", { userId, subjects });
        } catch {
          socket.emit("registerSolver", { subjects: [] });
        }
      })();
    };

    try {
      const socket = sharedSocket ?? connectSocket();
      if (!socket) return;

      socketRef.current = socket;
      registerAsSolver(socket);

      onSocketConnect = () => registerAsSolver(socket);
      socket.on("connect", onSocketConnect);

      onDoubtAvailable = (payload: Record<string, unknown>) => {
        showIncoming(incomingDoubtFromPayload(payload));
      };

      onDoubtAssigned = ({ doubtId }) => {
        setIncomingDoubt((prev) => {
          if (prev && String(prev.doubtId) === String(doubtId)) {
            setShowModal(false);
            return null;
          }
          return prev;
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("edu:doubt-assigned", { detail: { doubtId: String(doubtId) } })
          );
        }
      };

      onDoubtRated = ({ doubtId, rating }) => {
        setRatedToast(
          `Asker rated ${rating ? `(${rating}/5)` : ""} and ended session. Doubt ${String(doubtId ?? "").slice(-6)}.`
        );
        window.setTimeout(() => setRatedToast(null), 5000);
      };

      socket.on("doubt:available", onDoubtAvailable);
      socket.on("doubt:assigned", onDoubtAssigned);
      socket.on("doubt:rated", onDoubtRated);
    } catch {
      /* ignore */
    }

    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/solver/available-doubts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const list = (json?.data || []) as Array<{ _id?: string; id?: string }>;
        if (seenAvailableIdsRef.current.size === 0) {
          list.forEach((d) => seenAvailableIdsRef.current.add(String(d._id || d.id)));
        } else {
          const fresh = list.find((d) => !seenAvailableIdsRef.current.has(String(d._id || d.id)));
          if (fresh) {
            const id = String(fresh._id || fresh.id);
            seenAvailableIdsRef.current.add(id);
            showIncoming(
              incomingDoubtFromPayload({
                doubtId: id,
                subject: (fresh as { subject?: string }).subject,
                description: (fresh as { description?: string }).description,
                status: (fresh as { status?: string }).status,
                createdAt: (fresh as { createdAt?: string }).createdAt,
                is_scheduled: (fresh as { is_scheduled?: boolean }).is_scheduled,
                scheduled_date: (fresh as { scheduled_date?: string }).scheduled_date,
                scheduled_time: (fresh as { scheduled_time?: string }).scheduled_time,
              })
            );
          }
        }
      } catch {
        /* ignore */
      }
    }, POLL_MS);

    return () => {
      const socket = socketRef.current;
      if (socket) {
        if (onSocketConnect) socket.off("connect", onSocketConnect);
        if (onDoubtAvailable) socket.off("doubt:available", onDoubtAvailable);
        if (onDoubtAssigned) socket.off("doubt:assigned", onDoubtAssigned);
        if (onDoubtRated) socket.off("doubt:rated", onDoubtRated);
      }
      socketRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enabled, authReady, isSolver, sharedSocket, connectSocket, showIncoming]);

  return {
    isSolver,
    authReady,
    incomingDoubt,
    showModal: showModal && Boolean(incomingDoubt),
    isJoining,
    acceptAndJoin,
    dismiss,
    ratedToast,
  };
}

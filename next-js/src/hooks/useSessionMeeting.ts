"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import {
  ASKER_REJOIN_GRACE_SECONDS,
  categorySessionLabel,
  parseSessionRoomId,
} from "@/src/lib/session/roomId";
import { SOCKET_EVENTS } from "@/src/socket/events";
import { useCurrentSessionUser } from "@/src/hooks/useCurrentSessionUser";

type UseSessionMeetingParams = {
  roomId?: string;
  socket: Socket | null;
  initiateConnection: boolean;
  /** From Room document via validate-room (no doubt API for duration). */
  maxSessionSecondsFromRoom?: number | null;
};

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function labelFromMaxSeconds(maxSeconds: number) {
  if (maxSeconds <= 20 * 60) return categorySessionLabel("small");
  if (maxSeconds >= 60 * 60) return categorySessionLabel("large");
  return categorySessionLabel("medium");
}

export function useSessionMeeting({
  roomId,
  socket,
  initiateConnection,
  maxSessionSecondsFromRoom,
}: UseSessionMeetingParams) {
  const currentUser = useCurrentSessionUser();
  const parsed = useMemo(() => parseSessionRoomId(roomId), [roomId]);

  const [plannedSeconds, setPlannedSeconds] = useState<number | null>(null);
  const [meetingRemainingSecs, setMeetingRemainingSecs] = useState<number | null>(null);
  const [askerGraceRemainingSecs, setAskerGraceRemainingSecs] = useState<number | null>(null);
  const [askerTemporaryDisconnect, setAskerTemporaryDisconnect] = useState(false);
  const [solverTemporaryDisconnect, setSolverTemporaryDisconnect] = useState(false);
  const [bothJoinedAt, setBothJoinedAt] = useState<number | null>(null);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState<string | null>(null);
  const [sessionEndNotice, setSessionEndNotice] = useState<{
    message: string;
    redirectSeconds: number;
  } | null>(null);
  const [hasLoadedDuration, setHasLoadedDuration] = useState(false);
  const graceExpiredEmittedRef = useRef(false);
  const timerExpiredEmittedRef = useRef(false);

  const isSolver = Boolean(parsed && currentUser?.userId && parsed.solverId === currentUser.userId);
  const isAsker = Boolean(parsed && currentUser?.userId && !isSolver);
  const isInAskerGrace = askerGraceRemainingSecs != null && askerGraceRemainingSecs > 0;

  const solverElapsedSeconds = useCallback(() => {
    if (!bothJoinedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - bothJoinedAt) / 1000));
  }, [bothJoinedAt]);

  useEffect(() => {
    if (!maxSessionSecondsFromRoom || maxSessionSecondsFromRoom <= 0) {
      setHasLoadedDuration(false);
      return;
    }
    setPlannedSeconds(maxSessionSecondsFromRoom);
    if (bothJoinedAt == null) {
      setMeetingRemainingSecs(maxSessionSecondsFromRoom);
    }
    setHasLoadedDuration(true);
  }, [maxSessionSecondsFromRoom, bothJoinedAt]);

  useEffect(() => {
    if (!initiateConnection || !roomId || !socket || !hasLoadedDuration) return;
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
  }, [roomId, socket, initiateConnection, hasLoadedDuration]);

  useEffect(() => {
    if (!socket) return;

    const applyTimer = (payload?: { startedAt?: number; maxSessionSeconds?: number }) => {
      const maxSecs =
        payload?.maxSessionSeconds ?? plannedSeconds ?? maxSessionSecondsFromRoom ?? 30 * 60;
      const started = payload?.startedAt ?? Date.now();
      const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
      const remaining = Math.max(0, maxSecs - elapsed);
      setPlannedSeconds(maxSecs);
      setBothJoinedAt(started);
      setMeetingRemainingSecs(remaining);
    };

    const onTimerStart = (payload?: { startedAt?: number; maxSessionSeconds?: number }) => {
      applyTimer(payload);
    };

    const onAskerDisconnected = (payload?: { message?: string }) => {
      if (!isSolver) return;
      setAskerTemporaryDisconnect(true);
      toast(
        payload?.message?.trim() ||
          "The asker may have reloaded or has a temporary connection issue. Please wait.",
        { icon: "📡" }
      );
    };

    const onAskerLeft = (payload?: { graceSeconds?: number }) => {
      if (!isSolver) return;
      setAskerTemporaryDisconnect(false);
      const secs = payload?.graceSeconds ?? ASKER_REJOIN_GRACE_SECONDS;
      graceExpiredEmittedRef.current = false;
      setAskerGraceRemainingSecs(secs);
      toast("Asker left — please wait up to 3 minutes for them to rejoin.", { icon: "⏳" });
    };

    const onAskerRejoined = (payload?: { message?: string }) => {
      if (!isSolver) return;
      graceExpiredEmittedRef.current = false;
      setAskerTemporaryDisconnect(false);
      setAskerGraceRemainingSecs(null);
      toast.success(payload?.message?.trim() || "Asker has rejoined the session.");
    };

    const onSolverDisconnected = (payload?: { message?: string }) => {
      if (!isAsker) return;
      setSolverTemporaryDisconnect(true);
      toast(
        payload?.message?.trim() ||
          "Your solver may have reloaded or has a temporary connection issue. Please wait.",
        { icon: "📡" }
      );
    };

    const onSolverRejoined = (payload?: { message?: string }) => {
      if (!isAsker) return;
      setSolverTemporaryDisconnect(false);
      toast.success(payload?.message?.trim() || "Solver has rejoined the session.");
    };

    const onOtherJoined = (payload?: { user?: { userId?: string } }) => {
      if (!parsed) return;
      const joinedUserId = payload?.user?.userId;
      if (!joinedUserId) return;

      if (isSolver && joinedUserId !== parsed.solverId) {
        graceExpiredEmittedRef.current = false;
        setAskerTemporaryDisconnect(false);
        setAskerGraceRemainingSecs(null);
      }

      if (isAsker && joinedUserId === parsed.solverId) {
        setSolverTemporaryDisconnect(false);
      }
    };

    const onProcessed = (payload?: {
      reason?: string;
      feedbackRating?: number;
      walletCredited?: boolean;
    }) => {
      setSessionProcessed(true);
      setSessionEndReason(payload?.reason ?? null);
      setAskerGraceRemainingSecs(null);
      setAskerTemporaryDisconnect(false);
      setSolverTemporaryDisconnect(false);
      if (isSolver && payload?.reason === "solver_left") {
        const rating = payload.feedbackRating;
        const credited = payload.walletCredited;
        toast.success(
          rating != null
            ? `Session ended · ${rating}/5 rating${credited ? " · coins credited" : ""}`
            : "Session ended. Your doubt has been released."
        );
      }
      if (isSolver && payload?.reason === "asker_left_rated") {
        const rating = payload.feedbackRating;
        const credited = payload.walletCredited;
        toast.success(
          rating != null
            ? `Asker ended the session · you received ${rating}/5${credited ? " · coins credited" : ""}`
            : "Asker ended the session and will not return."
        );
      }
      if (payload?.reason === "timer_completed") {
        const rating = payload.feedbackRating;
        const credited = payload.walletCredited;
        toast.success(
          rating != null
            ? `Session complete · ${rating}/5 rating${credited && isSolver ? " · coins credited" : ""}`
            : "Scheduled session time has ended."
        );
      }
    };

    const onSessionEndIntimation = (payload?: {
      message?: string;
      redirectSeconds?: number;
      reason?: string;
    }) => {
      setSessionEndNotice({
        message:
          payload?.message?.trim() ||
          "Your session has ended. You will be redirected to the dashboard in 5 seconds.",
        redirectSeconds:
          typeof payload?.redirectSeconds === "number" && payload.redirectSeconds > 0
            ? Math.floor(payload.redirectSeconds)
            : 5,
      });
    };

    socket.on(SOCKET_EVENTS.SESSION_TIMER_START, onTimerStart);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_DISCONNECTED, onAskerDisconnected);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_LEFT, onAskerLeft);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_REJOINED, onAskerRejoined);
    socket.on(SOCKET_EVENTS.SESSION_SOLVER_DISCONNECTED, onSolverDisconnected);
    socket.on(SOCKET_EVENTS.SESSION_SOLVER_REJOINED, onSolverRejoined);
    socket.on(SOCKET_EVENTS.SESSION_PROCESSED, onProcessed);
    socket.on(SOCKET_EVENTS.SESSION_END_INTIMATION, onSessionEndIntimation);
    socket.on(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_TIMER_START, onTimerStart);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_DISCONNECTED, onAskerDisconnected);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_LEFT, onAskerLeft);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_REJOINED, onAskerRejoined);
      socket.off(SOCKET_EVENTS.SESSION_SOLVER_DISCONNECTED, onSolverDisconnected);
      socket.off(SOCKET_EVENTS.SESSION_SOLVER_REJOINED, onSolverRejoined);
      socket.off(SOCKET_EVENTS.SESSION_PROCESSED, onProcessed);
      socket.off(SOCKET_EVENTS.SESSION_END_INTIMATION, onSessionEndIntimation);
      socket.off(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);
    };
  }, [socket, isSolver, isAsker, parsed, plannedSeconds, maxSessionSecondsFromRoom]);

  useEffect(() => {
    if (!bothJoinedAt || meetingRemainingSecs == null || meetingRemainingSecs <= 0) return;
    const t = setInterval(() => {
      setMeetingRemainingSecs((s) => (s != null && s > 0 ? s - 1 : s));
    }, 1000);
    return () => clearInterval(t);
  }, [meetingRemainingSecs, bothJoinedAt]);

  useEffect(() => {
    if (askerGraceRemainingSecs == null || askerGraceRemainingSecs <= 0) return;
    const t = setInterval(() => {
      setAskerGraceRemainingSecs((s) => {
        if (s == null || s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [askerGraceRemainingSecs]);

  useEffect(() => {
    if (!sessionEndNotice || sessionEndNotice.redirectSeconds <= 0) return;
    const t = setInterval(() => {
      setSessionEndNotice((prev) => {
        if (!prev) return prev;
        if (prev.redirectSeconds <= 1) {
          return { ...prev, redirectSeconds: 0 };
        }
        return { ...prev, redirectSeconds: prev.redirectSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sessionEndNotice]);

  useEffect(() => {
    if (!isSolver || !socket || !roomId) return;
    if (askerGraceRemainingSecs !== 0) return;
    if (graceExpiredEmittedRef.current) return;

    graceExpiredEmittedRef.current = true;
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
      roomId,
      elapsedSeconds: solverElapsedSeconds(),
      finalizeAs: "asker_left_timeout",
    });
  }, [askerGraceRemainingSecs, isSolver, socket, roomId, solverElapsedSeconds]);

  const effectivePlannedSeconds = plannedSeconds ?? maxSessionSecondsFromRoom ?? 30 * 60;

  useEffect(() => {
    if (!socket || !roomId || !bothJoinedAt) return;
    if (meetingRemainingSecs !== 0) return;
    if (isInAskerGrace) return;
    if (timerExpiredEmittedRef.current || sessionProcessed) return;

    timerExpiredEmittedRef.current = true;
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
      roomId,
      elapsedSeconds: effectivePlannedSeconds,
      finalizeAs: "timer_completed",
    });
  }, [
    socket,
    roomId,
    bothJoinedAt,
    meetingRemainingSecs,
    isInAskerGrace,
    sessionProcessed,
    effectivePlannedSeconds,
  ]);

  const emitParticipantLeave = useCallback(() => {
    if (!socket || !roomId) return;
    const elapsedSeconds = solverElapsedSeconds();
    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
      roomId,
      elapsedSeconds,
      ...(isInAskerGrace
        ? { finalizeAs: "solver_left_during_asker_grace" as const }
        : {}),
    });
  }, [socket, roomId, isInAskerGrace, solverElapsedSeconds]);

  const emitAskerLeave = useCallback(
    (options: { withRating: boolean; rating?: number; comment?: string }) => {
      if (!socket || !roomId || !isAsker) return;
      const elapsedSeconds = solverElapsedSeconds();
      if (options.withRating && options.rating != null && options.rating >= 1) {
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
          roomId,
          elapsedSeconds,
          askerRatedOnLeave: true,
          askerRating: options.rating,
          askerComment: options.comment ?? "",
        });
      } else {
        socket.emit(SOCKET_EVENTS.LEAVE_ROOM, {
          roomId,
          elapsedSeconds,
        });
      }
    },
    [socket, roomId, isAsker, solverElapsedSeconds]
  );

  const clearSessionEndNotice = useCallback(() => {
    setSessionEndNotice(null);
  }, []);

  const displaySeconds = meetingRemainingSecs ?? effectivePlannedSeconds;
  const isTimerRunning = bothJoinedAt != null && (meetingRemainingSecs ?? 0) > 0;

  return {
    isSolver,
    isAsker,
    categorySessionLabel: labelFromMaxSeconds(effectivePlannedSeconds),
    meetingRemainingSecs,
    meetingTimerLabel: formatCountdown(displaySeconds),
    isTimerRunning,
    askerGraceLabel:
      askerGraceRemainingSecs != null ? formatCountdown(askerGraceRemainingSecs) : null,
    showAskerGraceBanner: isSolver && isInAskerGrace,
    showAskerReconnectBanner: isSolver && askerTemporaryDisconnect && !isInAskerGrace,
    showSolverReconnectBanner: isAsker && solverTemporaryDisconnect,
    sessionProcessed,
    sessionEndReason,
    sessionEndNotice,
    clearSessionEndNotice,
    emitParticipantLeave,
    emitAskerLeave,
  };
}

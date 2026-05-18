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
  const [bothJoinedAt, setBothJoinedAt] = useState<number | null>(null);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  const [hasLoadedDuration, setHasLoadedDuration] = useState(false);
  const graceExpiredEmittedRef = useRef(false);

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

    const onAskerLeft = (payload?: { graceSeconds?: number }) => {
      if (!isSolver) return;
      const secs = payload?.graceSeconds ?? ASKER_REJOIN_GRACE_SECONDS;
      graceExpiredEmittedRef.current = false;
      setAskerGraceRemainingSecs(secs);
      toast("Asker left — please wait up to 3 minutes for them to rejoin.", { icon: "⏳" });
    };

    const onAskerRejoined = () => {
      graceExpiredEmittedRef.current = false;
      setAskerGraceRemainingSecs(null);
      toast.success("Asker has rejoined the session.");
    };

    const onOtherJoined = (payload?: { user?: { userId?: string } }) => {
      if (!isSolver || !parsed) return;
      const joinedUserId = payload?.user?.userId;
      if (joinedUserId && joinedUserId !== parsed.solverId) {
        graceExpiredEmittedRef.current = false;
        setAskerGraceRemainingSecs(null);
      }
    };

    const onProcessed = (payload?: {
      reason?: string;
      feedbackRating?: number;
      walletCredited?: boolean;
    }) => {
      setSessionProcessed(true);
      setAskerGraceRemainingSecs(null);
      if (isSolver && payload?.reason === "solver_left") {
        const rating = payload.feedbackRating;
        const credited = payload.walletCredited;
        toast.success(
          rating != null
            ? `Session ended · ${rating}/5 rating${credited ? " · coins credited" : ""}`
            : "Session ended. Your doubt has been released."
        );
      }
    };

    socket.on(SOCKET_EVENTS.SESSION_TIMER_START, onTimerStart);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_LEFT, onAskerLeft);
    socket.on(SOCKET_EVENTS.SESSION_ASKER_REJOINED, onAskerRejoined);
    socket.on(SOCKET_EVENTS.SESSION_PROCESSED, onProcessed);
    socket.on(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_TIMER_START, onTimerStart);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_LEFT, onAskerLeft);
      socket.off(SOCKET_EVENTS.SESSION_ASKER_REJOINED, onAskerRejoined);
      socket.off(SOCKET_EVENTS.SESSION_PROCESSED, onProcessed);
      socket.off(SOCKET_EVENTS.OTHER_PERSON_JOINED, onOtherJoined);
    };
  }, [socket, isSolver, parsed, plannedSeconds, maxSessionSecondsFromRoom]);

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

  const effectivePlannedSeconds = plannedSeconds ?? maxSessionSecondsFromRoom ?? 30 * 60;
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
    sessionProcessed,
    emitParticipantLeave,
  };
}

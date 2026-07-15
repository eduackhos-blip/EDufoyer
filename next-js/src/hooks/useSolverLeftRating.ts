"use client";

import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_EVENTS } from "@/src/socket/events";
import doubtService from "@/src/services/doubtService";

export type SolverLeftPayload = {
  roomId?: string;
  doubtId?: string;
  reason?: string;
  message?: string;
  feedbackRating?: number;
  attendancePercent?: number;
  ratingSource?: string;
};

type UseSolverLeftRatingParams = {
  socket: Socket | null;
  isAsker: boolean;
  doubtId?: string;
  onSessionEnd?: () => void;
};

export function useSolverLeftRating({
  socket,
  isAsker,
  doubtId,
  onSessionEnd,
}: UseSolverLeftRatingParams) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | undefined>();
  const [ratingDoubtId, setRatingDoubtId] = useState<string | undefined>();
  const [systemRating, setSystemRating] = useState<number | null>(null);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!socket || !isAsker) return;

    const onSolverLeft = (payload: SolverLeftPayload = {}) => {
      const id = payload.doubtId ?? doubtId;
      if (!id) return;

      const rating =
        typeof payload.feedbackRating === "number" ? payload.feedbackRating : null;

      toast(payload.message ?? "Your solver has left the session.", { icon: "👋", duration: 6000 });
      setRatingDoubtId(String(id));
      setRatingMessage(payload.message);
      setSystemRating(rating);
      setAttendancePercent(
        typeof payload.attendancePercent === "number" ? payload.attendancePercent : null
      );
      setShowRatingModal(true);
      onSessionEnd?.();
    };

    socket.on(SOCKET_EVENTS.SESSION_SOLVER_LEFT, onSolverLeft);
    return () => {
      socket.off(SOCKET_EVENTS.SESSION_SOLVER_LEFT, onSolverLeft);
    };
  }, [socket, isAsker, doubtId, onSessionEnd]);

  const submitRating = useCallback(
    async (_rating: number, comment: string): Promise<boolean> => {
      const id = ratingDoubtId ?? doubtId;
      if (!id) return false;

      setSubmitting(true);
      try {
        const ratingToSend = systemRating ?? _rating;
        if (ratingToSend < 1) {
          setShowRatingModal(false);
          return true;
        }

        await doubtService.submitFeedback(id, { rating: ratingToSend, comment });
        toast.success(
          comment.trim()
            ? "Thank you — your note was saved."
            : "Session ended. Your solver was rated automatically."
        );
        setShowRatingModal(false);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save your note";
        toast.error(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [ratingDoubtId, doubtId, systemRating]
  );

  return {
    showRatingModal,
    ratingDoubtId: ratingDoubtId ?? doubtId,
    ratingMessage,
    systemRating,
    attendancePercent,
    submitting,
    submitRating,
  };
}

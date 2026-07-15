"use client";

import { useEffect, useState } from "react";
import {
  buildSessionRoomId,
  isBareMongoObjectId,
  parseSessionRoomId,
} from "@/src/lib/session/roomId";
import doubtService from "@/src/services/doubtService";

type RoomValidationCode = "room_not_found" | "room_closed" | "invalid_format";

async function validateSessionRoom(roomId: string): Promise<{
  valid: boolean;
  code?: RoomValidationCode;
  maxSessionSeconds?: number;
}> {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `/api/sessions/validate-room?roomId=${encodeURIComponent(roomId)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      valid?: boolean;
      maxSessionSeconds?: number;
    };
    return {
      valid: body.valid === true,
      maxSessionSeconds:
        typeof body.maxSessionSeconds === "number" ? body.maxSessionSeconds : undefined,
    };
  }

  if (res.status === 404) {
    const body = (await res.json().catch(() => ({}))) as { code?: RoomValidationCode };
    return {
      valid: false,
      code: body.code === "room_closed" ? "room_closed" : "room_not_found",
    };
  }

  if (res.status === 400) {
    return { valid: false, code: "invalid_format" };
  }

  return { valid: false, code: "room_not_found" };
}

/**
 * Route param may be full room id OR bare doubt id (legacy navigations).
 * Session + timer require the canonical `doubt-{doubtId}-solver-{solverId}` form.
 * Validates that a Room document exists before the session UI loads.
 */
export function useResolvedSessionRoomId(routeParam: string | undefined) {
  const [resolvedRoomId, setResolvedRoomId] = useState<string | undefined>();
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [roomUnavailable, setRoomUnavailable] = useState(false);
  const [roomUnavailableCode, setRoomUnavailableCode] = useState<RoomValidationCode | null>(null);
  const [maxSessionSeconds, setMaxSessionSeconds] = useState<number | null>(null);

  useEffect(() => {
    const trimmed = routeParam?.trim();
    if (!trimmed) {
      setResolvedRoomId(undefined);
      setResolveError(null);
      setRoomUnavailable(false);
      setRoomUnavailableCode(null);
      setMaxSessionSeconds(null);
      return;
    }

    let cancelled = false;

    const finishUnavailable = (code: RoomValidationCode) => {
      setResolvedRoomId(undefined);
      setResolveError(null);
      setRoomUnavailable(true);
      setRoomUnavailableCode(code);
    };

    void (async () => {
      setIsResolving(true);
      setResolveError(null);
      setRoomUnavailable(false);
      setRoomUnavailableCode(null);
      setMaxSessionSeconds(null);

      try {
        let candidateRoomId: string | undefined;

        if (parseSessionRoomId(trimmed)) {
          candidateRoomId = trimmed;
        } else if (isBareMongoObjectId(trimmed)) {
          const doubt = await doubtService.getDoubtById(trimmed);
          if (cancelled) return;

          const solverId =
            doubt?.solver_id ??
            doubt?.solverId ??
            doubt?.solver?._id ??
            doubt?.solver?.id;

          if (!solverId) {
            setResolvedRoomId(undefined);
            setResolveError("No solver assigned yet. Wait for a solver to accept this doubt.");
            setRoomUnavailable(false);
            return;
          }

          const doubtId = String(doubt?._id ?? doubt?.id ?? trimmed);
          candidateRoomId = buildSessionRoomId(doubtId, String(solverId));
        } else {
          setResolvedRoomId(undefined);
          setResolveError("This link does not look like a valid session. Check the URL or open the session from your dashboard.");
          setRoomUnavailable(false);
          return;
        }

        const validation = await validateSessionRoom(candidateRoomId);
        if (cancelled) return;

        if (!validation.valid) {
          finishUnavailable(validation.code ?? "room_not_found");
          return;
        }

        setResolvedRoomId(candidateRoomId);
        setResolveError(null);
        setRoomUnavailable(false);
        setRoomUnavailableCode(null);
        setMaxSessionSeconds(validation.maxSessionSeconds ?? null);
      } catch {
        if (!cancelled) {
          setResolvedRoomId(undefined);
          setResolveError("Could not load session details. Please try again.");
          setRoomUnavailable(false);
        }
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeParam]);

  return {
    roomId: resolvedRoomId,
    parsed: parseSessionRoomId(resolvedRoomId),
    maxSessionSeconds,
    isResolving,
    resolveError,
    roomUnavailable,
    roomUnavailableCode,
  };
}

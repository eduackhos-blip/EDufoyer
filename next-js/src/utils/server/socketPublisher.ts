import { serverEnv } from "@/src/utils/server/env";

export type SocketEmitInput = {
  event: string;
  payload?: unknown;
  room?: string;
};

const publisherUrl = `${serverEnv.socketPublishUrl.replace(/\/+$/, "")}`;

export const publishSocketEvent = async (event: SocketEmitInput) => {
  if (!event.event) return;
  try {
    const res = await fetch(`${publisherUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(serverEnv.socketServerApiKey
          ? { "x-socket-api-key": serverEnv.socketServerApiKey }
          : {}),
      },
      body: JSON.stringify(event),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[socketPublisher] emit failed (${res.status}):`,
        body || res.statusText,
        event
      );
    }
  } catch (error) {
    console.error("[socketPublisher] emit failed:", error);
  }
};

export const publishSocketEvents = async (events: SocketEmitInput[]) => {
  if (!Array.isArray(events) || events.length === 0) return;
  try {
    const res = await fetch(`${publisherUrl}/emit-many`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(serverEnv.socketServerApiKey
          ? { "x-socket-api-key": serverEnv.socketServerApiKey }
          : {}),
      },
      body: JSON.stringify(events),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[socketPublisher] emit-many failed (${res.status}):`,
        body || res.statusText
      );
    }
  } catch (error) {
    console.error("[socketPublisher] emit-many failed:", error);
  }
};


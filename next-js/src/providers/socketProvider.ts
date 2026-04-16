import type { SocketEmitInput } from "@/src/server/socketPublisher";
import { publishSocketEvent } from "@/src/server/socketPublisher";

type EmitFn = (event: string, payload?: unknown) => void;

export type IoLike = {
  emit: EmitFn;
  to: (room: string) => { emit: EmitFn };
};

export const getIO = (): IoLike => ({
  emit: (event, payload) => {
    void publishSocketEvent({ event, payload } satisfies SocketEmitInput);
  },
  to: (room) => ({
    emit: (event, payload) => {
      void publishSocketEvent({ event, payload, room } satisfies SocketEmitInput);
    },
  }),
});

export const initSocket = () => null;


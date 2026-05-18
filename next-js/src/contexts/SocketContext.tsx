"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  socketId: string | null;
  connectSocket: () => Socket | null;
  disconnectSocket: () => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const getSocketUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (fromEnv) return fromEnv;
  return "http://localhost:4001";
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  const connectSocket = useCallback(() => {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem("token");
    if (!token) {
      return null;
    }

    if (!socketRef.current) {
      const socketUrl = getSocketUrl();
      if (!socketUrl) return null;

      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        autoConnect: false,
      });

      socket.on("connect", () => {
        setIsConnected(true);
        setSocketId(socket.id ?? null);
      });
      socket.on("disconnect", () => {
        setIsConnected(false);
        setSocketId(null);
      });
      socket.on("connect_error", (error) => {
        setIsConnected(false);
        setSocketId(null);
        console.error("[socket] connect_error:", error?.message ?? error);
      });

      socketRef.current = socket;
    }

    socketRef.current.auth = { token };

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    return socketRef.current;
  }, []);

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.disconnect();
    setIsConnected(false);
    setSocketId(null);
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    return () => {
      if (!socket) return;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSocketId(null);
    };
  }, [connectSocket]);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      isConnected,
      socketId,
      connectSocket,
      disconnectSocket,
    }),
    [isConnected, socketId, connectSocket, disconnectSocket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { Socket } from "socket.io";
import { config } from "../config";
import { User } from "../models/User";

type JwtPayload = {
  userId?: string;
  id?: string;
};

const getBearerFromHandshake = (socket: Socket): string | null => {
  const raw = socket.handshake.headers.authorization;
  if (typeof raw !== "string" || !raw.startsWith("Bearer ")) {
    return null;
  }
  const token = raw.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

const getTokenFromCookie = (socket: Socket): string | null => {
  const cookie = socket.handshake.headers.cookie;
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
};

const getTokenFromAuth = (socket: Socket): string | null => {
  const auth = socket.handshake.auth as { token?: unknown } | undefined;
  if (auth && typeof auth.token === "string" && auth.token.trim().length > 0) {
    return auth.token.trim();
  }
  return null;
};

export const getSocketAuthToken = (socket: Socket): string | null =>
  getTokenFromAuth(socket) ?? getBearerFromHandshake(socket) ?? getTokenFromCookie(socket);

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    if (!config.jwtSecret) {
      return next(new Error("Unauthorized: JWT_SECRET is not configured on socket server"));
    }

    const token = getSocketAuthToken(socket);
    if (!token) {
      return next(new Error("Unauthorized: missing token"));
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "TokenExpiredError") {
        return next(new Error("Unauthorized: token expired"));
      }
      return next(new Error("Unauthorized: invalid token"));
    }

    const userId = String(payload.userId ?? payload.id ?? "").trim();
    if (!userId) {
      return next(new Error("Unauthorized: invalid token payload"));
    }

    if (mongoose.connection.readyState !== 1) {
      return next(new Error("Unauthorized: database unavailable"));
    }

    const user = await User.findById(userId).select("email name username isActive").lean();
    if (!user) {
      return next(new Error("Unauthorized: user not found"));
    }
    if (user.isActive === false) {
      return next(new Error("Unauthorized: inactive user"));
    }

    const emailStr = typeof user.email === "string" ? user.email : "";
    const nameStr = typeof user.name === "string" ? user.name : "";
    const usernameField = typeof user.username === "string" ? user.username.trim() : "";
    const displayUsername =
      usernameField ||
      nameStr.split(/\s+/)[0]?.trim() ||
      emailStr.split("@")[0] ||
      "user";

    socket.user = {
      userId,
      username: displayUsername,
      email: emailStr,
      ...(nameStr ? { name: nameStr } : {}),
    };

    return next();
  } catch (err) {
    console.error("[socketAuthMiddleware]", err);
    return next(new Error("Unauthorized: authentication failed"));
  }
};

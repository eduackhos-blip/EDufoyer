import jwt from "jsonwebtoken";
import { serverEnv } from "@/src/utils/server/env";

type JwtPayload = {
  id?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
};

export const readBearerToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(" ");
  if (!type || !token || type.toLowerCase() !== "bearer") return null;
  return token;
};

export const verifyJwt = (token: string) => {
  if (!serverEnv.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, serverEnv.jwtSecret) as JwtPayload;
};

export const requireAuthFromHeaders = (authorizationHeader: string | null) => {
  const token = readBearerToken(authorizationHeader);
  if (!token) {
    throw new Error("Missing bearer token");
  }
  return verifyJwt(token);
};

export const requireAdminFromHeaders = (authorizationHeader: string | null) => {
  const payload = requireAuthFromHeaders(authorizationHeader);
  if (payload.role !== "admin") {
    throw new Error("Admin role required");
  }
  return payload;
};


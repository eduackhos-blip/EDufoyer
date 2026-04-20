import dotenv from "dotenv";
import path from "node:path";

const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();
const envFile = nodeEnv === "production" ? ".env.production" : ".env.development";

// Prefer explicit env files (.env.development/.env.production), fallback to plain .env.
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const parseAllowedOrigins = (raw?: string) => {
  if (!raw || raw.trim().length === 0) {
    return ["http://localhost:3000", "http://localhost:5173"];
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const config = {
  port: Number(process.env.SOCKET_PORT ?? 4001),
  mongoUri: process.env.MONGODB_URI ?? "",
  allowedOrigins: parseAllowedOrigins(process.env.SOCKET_ALLOWED_ORIGINS),
  publishApiKey: process.env.SOCKET_SERVER_API_KEY ?? "",
  /** Same secret as Edufoyer / Next.js API JWT signing (Bearer tokens). */
  jwtSecret: process.env.JWT_SECRET ?? "",
};

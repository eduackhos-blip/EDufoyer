import dotenv from "dotenv";

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
};

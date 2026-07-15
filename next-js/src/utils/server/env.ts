import { PRODUCTION_SOCKET_URL } from "@/src/config/socketUrl";

const requireEnv = (name: string, fallback = "") => {
  const value = process.env[name] ?? fallback;
  return value;
};

const defaultSocketPublishUrl =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_SOCKET_URL
    : "http://localhost:4001";

export const serverEnv = {
  mongoUri: requireEnv("MONGODB_URI", ""),
  jwtSecret: requireEnv("JWT_SECRET", ""),
  razorpayKeyId: requireEnv("RAZORPAY_KEY_ID", ""),
  razorpayKeySecret: requireEnv("RAZORPAY_KEY_SECRET", ""),
  socketPublishUrl: requireEnv("SOCKET_PUBLISH_URL", defaultSocketPublishUrl),
  socketServerApiKey: requireEnv("SOCKET_SERVER_API_KEY", ""),
};


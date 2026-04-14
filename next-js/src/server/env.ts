const requireEnv = (name: string, fallback = "") => {
  const value = process.env[name] ?? fallback;
  return value;
};

export const serverEnv = {
  backendApiOrigin: requireEnv("BACKEND_API_ORIGIN", "http://localhost:5000"),
  mongoUri: requireEnv("MONGODB_URI", ""),
  jwtSecret: requireEnv("JWT_SECRET", ""),
  livekitApiKey: requireEnv("LIVEKIT_API_KEY", ""),
  livekitApiSecret: requireEnv("LIVEKIT_API_SECRET", ""),
  razorpayKeyId: requireEnv("RAZORPAY_KEY_ID", ""),
  razorpayKeySecret: requireEnv("RAZORPAY_KEY_SECRET", ""),
  socketPublishUrl: requireEnv("SOCKET_PUBLISH_URL", "http://localhost:4001"),
  socketServerApiKey: requireEnv("SOCKET_SERVER_API_KEY", ""),
};

export const getBackendApiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${serverEnv.backendApiOrigin}${normalized}`;
};

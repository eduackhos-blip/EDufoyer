declare namespace NodeJS {
  interface ProcessEnv {
    // Node runtime
    NODE_ENV?: "development" | "production" | "test";

    // Server/core
    BACKEND_API_ORIGIN?: string;
    MONGODB_URI?: string;
    JWT_SECRET?: string;

    // LiveKit
    LIVEKIT_URL?: string;
    LIVEKIT_API_KEY?: string;
    LIVEKIT_API_SECRET?: string;

    // Payments
    RAZORPAY_KEY_ID?: string;
    RAZORPAY_KEY_SECRET?: string;

    // Socket publisher
    SOCKET_PUBLISH_URL?: string;
    SOCKET_SERVER_API_KEY?: string;

    // Email/SMTP
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;

    // AI
    OPENAI_API_KEY?: string;

    // Middleware/CORS
    CORS_ORIGIN?: string;
    CORS_ORIGINS?: string;

    // App URLs
    FRONTEND_URL?: string;
  }
}

export {};


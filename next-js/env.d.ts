/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace NodeJS {
  interface ProcessEnv {
    // Node runtime
    NODE_ENV?: "development" | "production" | "test";

    // Server/core
    BACKEND_API_ORIGIN?: string;
    MONGODB_URI?: string;
    JWT_SECRET?: string;

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
    /** Browser Socket.IO URL; production default: https://socket-server-steel.vercel.app */
    NEXT_PUBLIC_SOCKET_URL?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
  }
}

export {};


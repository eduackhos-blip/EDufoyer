import { NextRequest, NextResponse } from "next/server";

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  "https://edufoyer.com",
  "https://www.edufoyer.com",
  "http://edufoyer.com",
  "http://www.edufoyer.com",
];

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowedOrigins = new Set(
  allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins
);

const csp = [
  "default-src 'self'",
  "connect-src 'self' https://edufoyer.com https://www.edufoyer.com http://edufoyer.com https://socket-server-steel.vercel.app wss://socket-server-steel.vercel.app",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'self'",
].join("; ");

const applyCorsHeaders = (response: NextResponse, origin: string | null) => {
  response.headers.set("Vary", "Origin");
  if (origin && corsAllowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", csp);
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Mirror backend CORS allowlist behavior for browser clients.
  if (origin && !corsAllowedOrigins.has(origin)) {
    return NextResponse.json(
      { success: false, message: "Origin not allowed by CORS policy" },
      { status: 403 }
    );
  }

  // Short-circuit preflight requests.
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    applyCorsHeaders(response, origin);
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applyCorsHeaders(response, origin);
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};

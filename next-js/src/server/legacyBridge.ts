import express, { type Express, type Router } from "express";
import { EventEmitter } from "events";
import { createRequest, createResponse } from "node-mocks-http";
import { NextRequest, NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

type RouteGroup =
  | "auth"
  | "doubts"
  | "solver"
  | "profile"
  | "notifications"
  | "livekit"
  | "social"
  | "admin"
  | "wallet"
  | "university"
  | "payment"
  | "rating";

declare global {
  // eslint-disable-next-line no-var
  var __legacy_express_app__: Promise<Express> | undefined;
}

const loaders: Record<RouteGroup, () => Promise<{ default: Router }>> = {
  auth: () => import("@/src/server/ported-backend/routes/auth.js"),
  doubts: () => import("@/src/server/ported-backend/routes/doubt.js"),
  solver: () => import("@/src/server/ported-backend/routes/solver.js"),
  profile: () => import("@/src/server/ported-backend/routes/profile.js"),
  notifications: () => import("@/src/server/ported-backend/routes/notification.js"),
  livekit: () => import("@/src/server/ported-backend/routes/livekit.js"),
  social: () => import("@/src/server/ported-backend/routes/social.js"),
  admin: () => import("@/src/server/ported-backend/routes/admin.js"),
  wallet: () => import("@/src/server/ported-backend/routes/wallet.js"),
  university: () => import("@/src/server/ported-backend/routes/university.js"),
  payment: () => import("@/src/server/ported-backend/routes/payment.js"),
  rating: () => import("@/src/server/ported-backend/routes/rating.js"),
};

const buildLegacyApp = async () => {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  for (const [group, loadRouter] of Object.entries(loaders) as [RouteGroup, () => Promise<{ default: Router }>][]) {
    const mod = await loadRouter();
    app.use(`/api/${group}`, mod.default);
  }

  return app;
};

const getApp = async () => {
  if (!global.__legacy_express_app__) {
    global.__legacy_express_app__ = buildLegacyApp();
  }
  return global.__legacy_express_app__;
};

const resolvePath = async (ctx: Ctx) => {
  const resolved = await Promise.resolve(ctx.params);
  return resolved.path ?? [];
};

const waitForResponseEnd = async (res: ReturnType<typeof createResponse>) => {
  if (res._isEndCalled()) return;

  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    const emitter = res as unknown as EventEmitter;
    emitter.once("end", finish);
    emitter.once("finish", finish);
    setTimeout(resolve, 15000);
  });
};

const parseBody = async (req: NextRequest) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await req.json();
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  // Keep raw body fallback for other types including multipart/form-data
  return Buffer.from(await req.arrayBuffer());
};

const toNextResponse = (res: ReturnType<typeof createResponse>) => {
  const headersObj = res._getHeaders() as Record<string, string | string[]>;
  const headers = new Headers();
  Object.entries(headersObj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
      return;
    }
    headers.set(key, String(value));
  });

  const statusCode = (res as unknown as { statusCode?: number }).statusCode || 200;
  const rawData = res._getData();
  const isObject = rawData !== null && typeof rawData === "object" && !Buffer.isBuffer(rawData);
  const payload =
    isObject && !headers.has("content-type")
      ? JSON.stringify(rawData)
      : Buffer.isBuffer(rawData)
        ? rawData
        : String(rawData ?? "");
  if (isObject && !headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  return new NextResponse(payload as BodyInit, {
    status: statusCode,
    headers,
  });
};

export const executeLegacyRoute = async (group: RouteGroup, req: NextRequest, ctx: Ctx) => {
  const app = await getApp();
  const pathSegments = await resolvePath(ctx);
  const suffix = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const url = `/api/${group}${suffix}${req.nextUrl.search}`;

  const reqBody = await parseBody(req);
  const mockReq = createRequest({
    method: req.method as
      | "GET"
      | "POST"
      | "PUT"
      | "PATCH"
      | "DELETE"
      | "HEAD"
      | "OPTIONS",
    url,
    headers: Object.fromEntries(req.headers.entries()),
    body: reqBody,
  });

  const mockRes = createResponse({ eventEmitter: EventEmitter });
  (app as unknown as { handle: (req: unknown, res: unknown) => void }).handle(mockReq, mockRes);
  await waitForResponseEnd(mockRes);
  return toNextResponse(mockRes);
};

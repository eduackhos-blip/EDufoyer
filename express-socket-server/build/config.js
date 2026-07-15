"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();
const envFile = nodeEnv === "production" ? ".env.production" : ".env.development";
// Prefer explicit env files (.env.development/.env.production), fallback to plain .env.
dotenv_1.default.config({ path: node_path_1.default.resolve(process.cwd(), envFile) });
dotenv_1.default.config();
/** Defaults match next-js/proxy.ts so browsers on edufoyer.com can connect. */
const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://edufoyer.com",
    "http://edufoyer.com",
    "https://www.edufoyer.com",
];
const parseAllowedOrigins = (raw) => {
    if (!raw || raw.trim().length === 0) {
        return DEFAULT_ALLOWED_ORIGINS;
    }
    return raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
};
exports.config = {
    port: Number(process.env.SOCKET_PORT ?? 4001),
    mongoUri: process.env.MONGODB_URI ?? "",
    allowedOrigins: parseAllowedOrigins(process.env.SOCKET_ALLOWED_ORIGINS),
    publishApiKey: process.env.SOCKET_SERVER_API_KEY ?? "",
    /** Same secret as Edufoyer / Next.js API JWT signing (Bearer tokens). */
    jwtSecret: process.env.JWT_SECRET ?? "",
    /** Next.js app base URL for internal session processing API. */
    nextApiUrl: process.env.NEXT_API_URL ?? "http://localhost:3000",
};

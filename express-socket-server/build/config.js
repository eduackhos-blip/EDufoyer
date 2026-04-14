"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parseAllowedOrigins = (raw) => {
    if (!raw || raw.trim().length === 0) {
        return ["http://localhost:3000", "http://localhost:5173"];
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
};

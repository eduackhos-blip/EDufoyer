"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = exports.getSocketAuthToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const User_1 = require("../models/User");
const getBearerFromHandshake = (socket) => {
    const raw = socket.handshake.headers.authorization;
    if (typeof raw !== "string" || !raw.startsWith("Bearer ")) {
        return null;
    }
    const token = raw.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
};
const getTokenFromCookie = (socket) => {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie)
        return null;
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (!match?.[1])
        return null;
    try {
        return decodeURIComponent(match[1].trim());
    }
    catch {
        return match[1].trim();
    }
};
const getTokenFromAuth = (socket) => {
    const auth = socket.handshake.auth;
    if (auth && typeof auth.token === "string" && auth.token.trim().length > 0) {
        return auth.token.trim();
    }
    return null;
};
const getSocketAuthToken = (socket) => getTokenFromAuth(socket) ?? getBearerFromHandshake(socket) ?? getTokenFromCookie(socket);
exports.getSocketAuthToken = getSocketAuthToken;
const socketAuthMiddleware = async (socket, next) => {
    try {
        if (!config_1.config.jwtSecret) {
            return next(new Error("Unauthorized: JWT_SECRET is not configured on socket server"));
        }
        const token = (0, exports.getSocketAuthToken)(socket);
        if (!token) {
            return next(new Error("Unauthorized: missing token"));
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        }
        catch (e) {
            const name = e instanceof Error ? e.name : "";
            if (name === "TokenExpiredError") {
                return next(new Error("Unauthorized: token expired"));
            }
            return next(new Error("Unauthorized: invalid token"));
        }
        const userId = String(payload.userId ?? payload.id ?? "").trim();
        if (!userId) {
            return next(new Error("Unauthorized: invalid token payload"));
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            return next(new Error("Unauthorized: database unavailable"));
        }
        const user = await User_1.User.findById(userId).select("email name username isActive").lean();
        if (!user) {
            return next(new Error("Unauthorized: user not found"));
        }
        if (user.isActive === false) {
            return next(new Error("Unauthorized: inactive user"));
        }
        const emailStr = typeof user.email === "string" ? user.email : "";
        const nameStr = typeof user.name === "string" ? user.name : "";
        const usernameField = typeof user.username === "string" ? user.username.trim() : "";
        const displayUsername = usernameField ||
            nameStr.split(/\s+/)[0]?.trim() ||
            emailStr.split("@")[0] ||
            "user";
        socket.user = {
            userId,
            username: displayUsername,
            email: emailStr,
            ...(nameStr ? { name: nameStr } : {}),
        };
        return next();
    }
    catch (err) {
        console.error("[socketAuthMiddleware]", err);
        return next(new Error("Unauthorized: authentication failed"));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSessionUserPayload = toSessionUserPayload;
function toSessionUserPayload(user) {
    return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        ...(user.name ? { name: user.name } : {}),
    };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callProcessSessionEnd = callProcessSessionEnd;
const config_1 = require("../config");
async function callProcessSessionEnd(payload) {
    const base = config_1.config.nextApiUrl.replace(/\/+$/, "");
    const headers = {
        "Content-Type": "application/json",
    };
    if (config_1.config.publishApiKey) {
        headers["x-socket-api-key"] = config_1.config.publishApiKey;
    }
    try {
        const res = await fetch(`${base}/api/sessions/process-end`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok) {
            console.error("[session] process-end failed:", res.status, data);
            return { ok: false, data };
        }
        return { ok: true, data };
    }
    catch (error) {
        console.error("[session] process-end request error:", error);
        return { ok: false, error };
    }
}

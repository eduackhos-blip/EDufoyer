"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const Solver_1 = require("./models/Solver");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: config_1.config.allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true,
    transports: ["websocket", "polling"],
    upgradeTimeout: 10000,
    allowUpgrades: true,
    perMessageDeflate: true,
    connectTimeout: 45000,
});
app.use((0, cors_1.default)({
    origin: config_1.config.allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
const requirePublishApiKey = (req, res, next) => {
    if (!config_1.config.publishApiKey) {
        return next();
    }
    const headerKey = req.header("x-socket-api-key");
    const bearerToken = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (headerKey === config_1.config.publishApiKey || bearerToken === config_1.config.publishApiKey) {
        return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized publisher" });
};
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        service: "express-socket-server",
        mongoConnected: mongoose_1.default.connection.readyState === 1,
        clients: io.engine.clientsCount,
        timestamp: new Date().toISOString(),
    });
});
app.post("/emit", requirePublishApiKey, (req, res) => {
    const body = req.body;
    if (!body?.event) {
        return res.status(400).json({ success: false, message: "event is required" });
    }
    if (body.room) {
        io.to(body.room).emit(body.event, body.payload ?? {});
    }
    else {
        io.emit(body.event, body.payload ?? {});
    }
    return res.json({ success: true });
});
app.post("/emit-many", requirePublishApiKey, (req, res) => {
    const events = req.body;
    if (!Array.isArray(events) || events.length === 0) {
        return res
            .status(400)
            .json({ success: false, message: "Array of events is required" });
    }
    for (const evt of events) {
        if (!evt?.event)
            continue;
        if (evt.room) {
            io.to(evt.room).emit(evt.event, evt.payload ?? {});
        }
        else {
            io.emit(evt.event, evt.payload ?? {});
        }
    }
    return res.json({ success: true, emitted: events.length });
});
io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);
    socket.on("error", (error) => {
        console.error(`[socket] error (${socket.id}):`, error);
    });
    socket.on("disconnect", (reason) => {
        console.log(`[socket] disconnected: ${socket.id}, reason: ${reason}`);
    });
    socket.on("registerSolver", async ({ userId, subjects = [] }) => {
        try {
            if (userId) {
                socket.join(`solver:${userId}`);
            }
            let subjectList = Array.isArray(subjects) ? subjects : [];
            if (subjectList.length === 0 && userId) {
                const solverDoc = await Solver_1.Solver.findOne({ user_id: userId })
                    .select("specialities")
                    .lean();
                if (solverDoc?.specialities?.length) {
                    subjectList = solverDoc.specialities;
                }
            }
            const rooms = subjectList.map((subject) => `subject:${String(subject).toLowerCase()}`);
            rooms.forEach((room) => socket.join(room));
            socket.emit("registrationSuccess", {
                message: "Successfully registered as solver",
                subjects: subjectList,
            });
        }
        catch (error) {
            console.error("[socket] registerSolver failed:", error);
            socket.emit("registrationError", {
                message: "Failed to register as solver",
            });
        }
    });
    socket.on("ping", () => {
        socket.emit("pong");
    });
    socket.on("clientError", (error) => {
        console.error(`[socket] clientError (${socket.id}):`, error);
    });
});
const start = async () => {
    try {
        if (!config_1.config.mongoUri) {
            console.warn("MONGODB_URI not set. Subject fallback lookup will not work.");
        }
        else {
            await mongoose_1.default.connect(config_1.config.mongoUri);
            console.log("[mongo] connected");
        }
    }
    catch (error) {
        console.error("[mongo] connection failed:", error);
    }
    server.listen(config_1.config.port, () => {
        console.log(`[socket-server] listening on port ${config_1.config.port}`);
        console.log(`[socket-server] allowed origins: ${config_1.config.allowedOrigins.join(", ")}`);
    });
};
void start();

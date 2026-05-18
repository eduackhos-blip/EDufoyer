"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const edufoyer_socket_1 = require("./edufoyer/edufoyer.socket");
const events_1 = require("./events");
const message_socket_1 = require("./messages/message.socket");
const room_socket_1 = require("./room/room.socket");
const webrtc_socket_1 = require("./webrtc/webrtc.socket");
const setupSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log(`[socket] connected: ${socket.id} user=${socket.user.userId}`);
        socket.on(events_1.SOCKET_EVENTS.PING, () => {
            socket.emit(events_1.SOCKET_EVENTS.PONG, { message: "pong from server" });
        });
        (0, room_socket_1.registerRoomSocketHandlers)(socket, io);
        (0, webrtc_socket_1.registerWebRtcSocketHandlers)(socket);
        (0, message_socket_1.registerMessageSocketHandlers)(socket, io);
        (0, edufoyer_socket_1.registerEdufoyerSocketHandlers)(socket);
        socket.on("error", (error) => {
            console.error(`[socket] error (${socket.id}):`, error);
        });
        socket.on("clientError", (error) => {
            console.error(`[socket] clientError (${socket.id}):`, error);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;

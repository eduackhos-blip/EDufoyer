"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const RoomSchema = new mongoose_1.default.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    doubt_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Doubt",
        required: true,
    },
    solver_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    doubter_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subject: {
        type: String,
        trim: true,
        default: "",
    },
    status: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
    },
    closedAt: {
        type: Date,
        default: null,
    },
    hasSolverEverJoined: {
        type: Boolean,
        default: false,
    },
    hasAskerEverJoined: {
        type: Boolean,
        default: false,
    },
    maxSessionSeconds: {
        type: Number,
        default: null,
    },
    sessionStartedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
RoomSchema.index({ doubt_id: 1, solver_id: 1 }, { unique: true });
exports.Room = mongoose_1.default.models.Room || mongoose_1.default.model("Room", RoomSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doubt = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const DoubtSchema = new mongoose_1.default.Schema({
    subject: { type: String, trim: true },
    category: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
    },
    doubter_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    solver_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    status: { type: String },
}, { timestamps: true });
exports.Doubt = mongoose_1.default.models.Doubt || mongoose_1.default.model("Doubt", DoubtSchema);

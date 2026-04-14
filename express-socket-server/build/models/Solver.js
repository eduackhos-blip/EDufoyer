"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Solver = void 0;
const mongoose_1 = require("mongoose");
const solverSchema = new mongoose_1.Schema({
    user_id: { type: String, required: true },
    specialities: { type: [String], default: [] },
}, {
    collection: "solvers",
    strict: false,
});
exports.Solver = mongoose_1.models.Solver || (0, mongoose_1.model)("Solver", solverSchema);

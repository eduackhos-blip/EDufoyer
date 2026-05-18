import mongoose from "mongoose";

const DoubtSchema = new mongoose.Schema(
  {
    subject: { type: String, trim: true },
    category: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    doubter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    solver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String },
  },
  { timestamps: true }
);

export const Doubt =
  mongoose.models.Doubt || mongoose.model("Doubt", DoubtSchema);

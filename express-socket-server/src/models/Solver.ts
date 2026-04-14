import { Schema, model, models } from "mongoose";

type SolverDoc = {
  user_id: string;
  specialities: string[];
};

const solverSchema = new Schema<SolverDoc>(
  {
    user_id: { type: String, required: true },
    specialities: { type: [String], default: [] },
  },
  {
    collection: "solvers",
    strict: false,
  }
);

export const Solver = models.Solver || model<SolverDoc>("Solver", solverSchema);

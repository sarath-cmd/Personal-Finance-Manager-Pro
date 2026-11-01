import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { SAVINGS_GOAL_KINDS } from "@/lib/constants";

export { SAVINGS_GOAL_KINDS };

const savingsGoalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, enum: SAVINGS_GOAL_KINDS, default: "goal" },
    targetAmount: { type: Number, required: true, min: 0 },
    targetDate: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

savingsGoalSchema.index({ userId: 1, kind: 1 });

export type SavingsGoalDoc = InferSchemaType<typeof savingsGoalSchema> & { _id: Types.ObjectId };

export const SavingsGoal = models.SavingsGoal || model("SavingsGoal", savingsGoalSchema);

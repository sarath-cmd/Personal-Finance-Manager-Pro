import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const savingsContributionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    goalId: { type: Schema.Types.ObjectId, required: true, ref: "SavingsGoal" },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

savingsContributionSchema.index({ userId: 1, goalId: 1, date: -1 });

export type SavingsContributionDoc = InferSchemaType<typeof savingsContributionSchema> & {
  _id: Types.ObjectId;
};

export const SavingsContribution =
  models.SavingsContribution || model("SavingsContribution", savingsContributionSchema);

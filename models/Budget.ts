import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    month: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1 });
budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

export type BudgetDoc = InferSchemaType<typeof budgetSchema> & { _id: Types.ObjectId };

export const Budget = models.Budget || model("Budget", budgetSchema);

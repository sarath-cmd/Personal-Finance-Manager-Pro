import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { DEBT_TYPES } from "@/lib/constants";

export { DEBT_TYPES };

const debtSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: DEBT_TYPES, default: "Other" },
    openingBalance: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0, min: 0 },
    minPayment: { type: Number, default: 0, min: 0 },
    dueDay: { type: Number, default: null, min: 1, max: 31 },
  },
  { timestamps: true }
);

debtSchema.index({ userId: 1 });

export type DebtDoc = InferSchemaType<typeof debtSchema> & { _id: Types.ObjectId };

export const Debt = models.Debt || model("Debt", debtSchema);

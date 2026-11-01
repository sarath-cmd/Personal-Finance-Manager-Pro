import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const debtPaymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    debtId: { type: Schema.Types.ObjectId, required: true, ref: "Debt" },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

debtPaymentSchema.index({ userId: 1, debtId: 1, date: -1 });

export type DebtPaymentDoc = InferSchemaType<typeof debtPaymentSchema> & { _id: Types.ObjectId };

export const DebtPayment = models.DebtPayment || model("DebtPayment", debtPaymentSchema);

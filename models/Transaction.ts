import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { TRANSACTION_TYPES, INCOME_STATUSES, CLASSIFICATIONS, PAYMENT_METHODS } from "@/lib/constants";

export { TRANSACTION_TYPES, INCOME_STATUSES, CLASSIFICATIONS, PAYMENT_METHODS };

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: { type: String, required: true, enum: TRANSACTION_TYPES },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    billId: { type: Schema.Types.ObjectId, ref: "Bill", default: null },
    tags: { type: [String], default: [] },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    status: { type: String, enum: INCOME_STATUSES, default: "Received" },
    classification: {
      type: String,
      enum: CLASSIFICATIONS,
      default: "Unclassified",
    },
    // Balance-sync bookkeeping — records exactly what delta was applied to
    // which account so edits/deletes can reverse it precisely without drift.
    appliedDelta: { type: Number, default: 0 },
    appliedAccountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema> & {
  _id: Types.ObjectId;
};

export const Transaction =
  models.Transaction || model("Transaction", transactionSchema);

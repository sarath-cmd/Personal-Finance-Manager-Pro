import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const transferSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    date: { type: Date, required: true },
    fromAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, default: "" },
    // Balance-sync bookkeeping — mirrors Transaction.appliedDelta/appliedAccountId
    // so edits/deletes can reverse exactly what was applied, to both accounts.
    appliedFromDelta: { type: Number, default: 0 },
    appliedToDelta: { type: Number, default: 0 },
  },
  { timestamps: true }
);

transferSchema.index({ userId: 1, date: -1 });

export type TransferDoc = InferSchemaType<typeof transferSchema> & {
  _id: Types.ObjectId;
};

export const Transfer = models.Transfer || model("Transfer", transferSchema);

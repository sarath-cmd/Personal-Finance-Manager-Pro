import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { BILL_FREQUENCIES } from "@/lib/constants";

export { BILL_FREQUENCIES };

const billSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    frequency: { type: String, required: true, enum: BILL_FREQUENCIES, default: "Monthly" },
    isSubscription: { type: Boolean, default: false },
    autopay: { type: Boolean, default: false },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

billSchema.index({ userId: 1 });

export type BillDoc = InferSchemaType<typeof billSchema> & { _id: Types.ObjectId };

export const Bill = models.Bill || model("Bill", billSchema);

import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { INVESTMENT_KINDS } from "@/lib/constants";

export { INVESTMENT_KINDS };

const investmentEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    date: { type: Date, required: true },
    kind: { type: String, required: true, enum: INVESTMENT_KINDS },
    amount: { type: Number, required: true, min: 0.01 },
    quantity: { type: Number, min: 0, default: null },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

investmentEntrySchema.index({ userId: 1, kind: 1, date: -1 });

export type InvestmentEntryDoc = InferSchemaType<typeof investmentEntrySchema> & {
  _id: Types.ObjectId;
};

export const InvestmentEntry = models.InvestmentEntry || model("InvestmentEntry", investmentEntrySchema);

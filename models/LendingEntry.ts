import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { LENDING_ENTRY_TYPES } from "@/lib/constants";

export { LENDING_ENTRY_TYPES };

const lendingEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    personId: { type: Schema.Types.ObjectId, required: true, ref: "LendingPerson" },
    date: { type: Date, required: true },
    type: { type: String, required: true, enum: LENDING_ENTRY_TYPES },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

lendingEntrySchema.index({ userId: 1, personId: 1, date: -1 });

export type LendingEntryDoc = InferSchemaType<typeof lendingEntrySchema> & {
  _id: Types.ObjectId;
};

export const LendingEntry =
  models.LendingEntry || model("LendingEntry", lendingEntrySchema);

import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { ACCOUNT_TYPES } from "@/lib/constants";

export { ACCOUNT_TYPES };

const accountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ACCOUNT_TYPES },
    institution: { type: String, trim: true, default: "" },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1 });

export type AccountDoc = InferSchemaType<typeof accountSchema> & {
  _id: Types.ObjectId;
};

export const Account = models.Account || model("Account", accountSchema);

import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const lendingPersonSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: "" },
    groupId: { type: Schema.Types.ObjectId, ref: "LendingGroup", default: null },
  },
  { timestamps: true }
);

lendingPersonSchema.index({ userId: 1 });
lendingPersonSchema.index({ userId: 1, groupId: 1 });

export type LendingPersonDoc = InferSchemaType<typeof lendingPersonSchema> & {
  _id: Types.ObjectId;
};

export const LendingPerson =
  models.LendingPerson || model("LendingPerson", lendingPersonSchema);

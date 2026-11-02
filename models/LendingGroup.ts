import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const lendingGroupSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

lendingGroupSchema.index({ userId: 1 });

export type LendingGroupDoc = InferSchemaType<typeof lendingGroupSchema> & {
  _id: Types.ObjectId;
};

export const LendingGroup = models.LendingGroup || model("LendingGroup", lendingGroupSchema);

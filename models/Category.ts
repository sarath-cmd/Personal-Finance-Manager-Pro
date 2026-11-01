import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { TAG_KINDS } from "@/lib/constants";

const categorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    kind: { type: String, required: true, enum: TAG_KINDS },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, kind: 1 });
categorySchema.index({ userId: 1, kind: 1, name: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };

export const Category = models.Category || model("Category", categorySchema);

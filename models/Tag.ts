import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { TAG_KINDS } from "@/lib/constants";

export { TAG_KINDS };

const tagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    kind: { type: String, required: true, enum: TAG_KINDS },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true },
  },
  { timestamps: true }
);

tagSchema.index({ userId: 1, kind: 1 });

export type TagDoc = InferSchemaType<typeof tagSchema> & { _id: Types.ObjectId };

export const Tag = models.Tag || model("Tag", tagSchema);

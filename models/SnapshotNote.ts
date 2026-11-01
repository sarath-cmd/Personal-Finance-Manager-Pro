import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const snapshotNoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    month: { type: String, required: true },
    wentWell: { type: String, trim: true, default: "" },
    changed: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

snapshotNoteSchema.index({ userId: 1, month: 1 }, { unique: true });

export type SnapshotNoteDoc = InferSchemaType<typeof snapshotNoteSchema> & { _id: Types.ObjectId };

export const SnapshotNote = models.SnapshotNote || model("SnapshotNote", snapshotNoteSchema);

import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import { EVENT_TYPES } from "@/lib/constants";

export { EVENT_TYPES };

const eventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    date: { type: Date, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: EVENT_TYPES, default: "One-time" },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, date: 1 });

export type EventDoc = InferSchemaType<typeof eventSchema> & { _id: Types.ObjectId };

export const Event = models.Event || model("Event", eventSchema);

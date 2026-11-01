import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, date: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: Types.ObjectId };

export const Task = models.Task || model("Task", taskSchema);

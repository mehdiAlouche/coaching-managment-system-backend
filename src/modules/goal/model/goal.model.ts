import { Schema, model, Document } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  completed: boolean;
  organizationId: string;
}

const GoalSchema = new Schema<IGoal>({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  organizationId: { type: String }
}, { timestamps: true });

export const GoalModel = model<IGoal>('Goal', GoalSchema);

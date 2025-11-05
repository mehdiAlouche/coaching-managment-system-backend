import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  title: string;
  start: Date;
  end: Date;
  organizationId: string;
}

const SessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  organizationId: { type: String, required: true }
}, { timestamps: true });

export const SessionModel = model<ISession>('Session', SessionSchema);

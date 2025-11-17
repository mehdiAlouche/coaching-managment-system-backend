import { Schema, model, Document, Types } from 'mongoose';

export interface IFollowUpTask {
  description: string;
  dueDate?: Date;
  completed: boolean;
}

export interface IAttendanceRecord {
  present: boolean;
  notes?: string;
}

export interface ISessionNote extends Document {
  sessionId: Types.ObjectId;
  organizationId: Types.ObjectId;
  authorId: Types.ObjectId;
  visibility: 'internal' | 'shared';
  summary: string;
  details?: string;
  followUpTasks: IFollowUpTask[];
  attendance?: IAttendanceRecord;
}

const FollowUpTaskSchema = new Schema<IFollowUpTask>(
  {
    description: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendanceRecord>(
  {
    present: { type: Boolean, required: true },
    notes: { type: String },
  },
  { _id: false }
);

const SessionNoteSchema = new Schema<ISessionNote>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visibility: {
      type: String,
      enum: ['internal', 'shared'],
      default: 'internal',
    },
    summary: { type: String, required: true },
    details: { type: String },
    followUpTasks: { type: [FollowUpTaskSchema], default: [] },
    attendance: { type: AttendanceSchema },
  },
  { timestamps: true }
);

SessionNoteSchema.index({ organizationId: 1, sessionId: 1, createdAt: -1 });

export const SessionNoteModel = model<ISessionNote>('SessionNote', SessionNoteSchema);


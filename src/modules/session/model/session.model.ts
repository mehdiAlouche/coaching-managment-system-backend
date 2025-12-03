import { Schema, model, Document, Types, Model } from 'mongoose';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface IAgendaItem {
  title: string;
  description?: string;
  duration?: number;
  completed?: boolean;
}

export interface IAttachment {
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
}

export interface ISessionNotes {
  summary?: string;
  actionItems?: string[];
  privateNotes?: string;
  coachNotes?: string;
  entrepreneurNotes?: string;
  managerNotes?: string;
}

export interface ISessionRating {
  score?: number; // 1-5 rating
  comment?: string; // Short comment
  feedback?: string; // Detailed feedback
  submittedBy?: Types.ObjectId; // Who submitted the rating
  submittedAt?: Date; // When it was submitted
  ratedBy?: Types.ObjectId; // Deprecated: use submittedBy
  ratedAt?: Date; // Deprecated: use submittedAt
}

export interface ISession extends Document {
  organizationId: Types.ObjectId;
  coachId: Types.ObjectId;
  entrepreneurId: Types.ObjectId;
  managerId: Types.ObjectId;
  paymentId?: Types.ObjectId;
  scheduledAt: Date;
  endTime: Date;
  duration: number;
  status: SessionStatus;
  agendaItems: IAgendaItem[];
  notes: ISessionNotes;
  attachments: IAttachment[];
  rating?: ISessionRating;
  location?: string;
  videoConferenceUrl?: string;
}

export interface ISessionModel extends Model<ISession> {
  checkConflict(
    coachId: Types.ObjectId | string,
    scheduledAt: Date,
    endTime: Date,
    excludeSessionId?: Types.ObjectId | string
  ): Promise<boolean>;
}

const AgendaItemSchema = new Schema<IAgendaItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: Number, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession, ISessionModel>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entrepreneurId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    scheduledAt: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'scheduled',
    },
    agendaItems: { type: [AgendaItemSchema], default: [] },
    notes: {
      summary: { type: String },
      actionItems: { type: [String], default: [] },
      privateNotes: { type: String, select: false },
      coachNotes: { type: String },
      entrepreneurNotes: { type: String },
      managerNotes: { type: String },
    },
    attachments: { type: [AttachmentSchema], default: [] },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: { type: String },
      submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      submittedAt: { type: Date },
    },
    location: { type: String, trim: true },
    videoConferenceUrl: { type: String },
  },
  { timestamps: true }
);

SessionSchema.index({ organizationId: 1, scheduledAt: 1 });
SessionSchema.index({ coachId: 1, scheduledAt: 1 });
SessionSchema.index({ entrepreneurId: 1, scheduledAt: 1 });
SessionSchema.index({ managerId: 1, scheduledAt: 1 });
SessionSchema.index({ status: 1, scheduledAt: 1 });
SessionSchema.index({ scheduledAt: 1, endTime: 1 });

SessionSchema.statics.checkConflict = async function (
  coachId: Types.ObjectId | string,
  scheduledAt: Date,
  endTime: Date,
  excludeSessionId?: Types.ObjectId | string
) {
  const overlapQuery: Record<string, unknown> = {
    coachId,
    status: { $in: ['scheduled', 'rescheduled'] },
    scheduledAt: { $lt: endTime },
    endTime: { $gt: scheduledAt },
  };

  if (excludeSessionId) {
    overlapQuery._id = { $ne: excludeSessionId };
  }

  const existing = await this.findOne(overlapQuery).select('_id scheduledAt endTime');
  return Boolean(existing);
};

SessionSchema.pre('validate', function (this: ISession, next) {
  if (this.isModified('scheduledAt') || this.isModified('duration') || !this.endTime) {
    if (this.scheduledAt && typeof this.duration === 'number') {
      this.endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
    }
  }
  next();
});

export const SessionModel = model<ISession, ISessionModel>('Session', SessionSchema);

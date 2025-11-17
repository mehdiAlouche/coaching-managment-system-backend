import { Schema, model, Document, Types } from 'mongoose';

export type NotificationChannel = 'email' | 'sms' | 'in_app';

export interface INotification extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  channel: NotificationChannel;
  data?: Record<string, unknown>;
  readAt?: Date;
  sentAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ['email', 'sms', 'in_app'],
      default: 'in_app',
    },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });

export const NotificationModel = model<INotification>('Notification', NotificationSchema);


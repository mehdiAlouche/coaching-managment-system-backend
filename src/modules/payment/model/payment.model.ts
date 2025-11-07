import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'void';

export interface IPaymentLineItem {
  sessionId: Types.ObjectId;
  description?: string;
  duration: number;
  rate: number;
  amount: number;
}

export interface IPaymentReminder {
  sentAt: Date;
  type: 'email' | 'sms' | 'in_app';
}

export interface IPaymentPeriod {
  startDate: Date;
  endDate: Date;
}

export interface IPayment extends Document {
  organizationId: Types.ObjectId;
  coachId: Types.ObjectId;
  sessionIds: Types.ObjectId[];
  lineItems: IPaymentLineItem[];
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: PaymentStatus;
  invoiceNumber: string;
  invoiceUrl?: string;
  dueDate?: Date;
  paidAt?: Date;
  period?: IPaymentPeriod;
  remindersSent: IPaymentReminder[];
  notes?: string;
}

const LineItemSchema = new Schema<IPaymentLineItem>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    description: { type: String },
    duration: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IPaymentReminder>(
  {
    sentAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['email', 'sms', 'in_app'],
      default: 'email',
    },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionIds: [{ type: Schema.Types.ObjectId, ref: 'Session', required: true }],
    lineItems: { type: [LineItemSchema], default: [] },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'void'],
      default: 'pending',
    },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceUrl: { type: String },
    dueDate: { type: Date },
    paidAt: { type: Date },
    period: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    remindersSent: { type: [ReminderSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ organizationId: 1, coachId: 1 });
PaymentSchema.index({ status: 1, dueDate: 1 });
PaymentSchema.index({ invoiceNumber: 1 }, { unique: true });
PaymentSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

PaymentSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('taxAmount')) {
    this.totalAmount = this.amount + (this.taxAmount ?? 0);
  }
  next();
});

export const PaymentModel = model<IPayment>('Payment', PaymentSchema);

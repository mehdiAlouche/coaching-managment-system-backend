import { Schema, model, Document } from 'mongoose';

export interface IPayment extends Document {
  amount: number;
  currency: string;
  organizationId: string;
}

const PaymentSchema = new Schema<IPayment>({
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  organizationId: { type: String }
}, { timestamps: true });

export const PaymentModel = model<IPayment>('Payment', PaymentSchema);

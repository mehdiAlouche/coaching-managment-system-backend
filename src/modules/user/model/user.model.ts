import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'manager' | 'coach' | 'entrepreneur' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  organizationId?: Types.ObjectId;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  hourlyRate?: number; // coaches only
  startupName?: string; // entrepreneurs only
  phone?: string;
  timezone?: string;
  refreshToken?: string;
  tokenVersion?: number;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['manager', 'coach', 'entrepreneur', 'admin'],
      default: 'entrepreneur',
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    isActive: { type: Boolean, default: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    hourlyRate: { type: Number, min: 0 },
    startupName: { type: String, trim: true },
    phone: { type: String, trim: true },
    timezone: { type: String, trim: true },
    refreshToken: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, organizationId: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, organizationId: 1 });
UserSchema.index({ organizationId: 1, isActive: 1 });

export const UserModel = model<IUser>('User', UserSchema);

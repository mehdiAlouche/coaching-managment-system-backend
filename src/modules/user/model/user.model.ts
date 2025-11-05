import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: string;
  organizationId?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  organizationId: { type: String }
}, { timestamps: true });

export const UserModel = model<IUser>('User', UserSchema);

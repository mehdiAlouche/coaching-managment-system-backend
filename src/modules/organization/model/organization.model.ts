import { Schema, model, Document } from 'mongoose';

export type SubscriptionPlan = 'free' | 'standard' | 'premium';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled';

export interface IOrganizationSettings {
  timezone?: string;
  locale?: string;
  taxRate?: number;
  notificationPreferences?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface IOrganizationContact {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface IOrganizationPreferences {
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  communication?: Record<string, unknown>;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  settings: IOrganizationSettings;
  contact?: IOrganizationContact;
  preferences?: IOrganizationPreferences;
  logoPath?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionRenewalAt?: Date;
  maxUsers?: number;
  maxCoaches?: number;
  maxEntrepreneurs?: number;
  billingEmail?: string;
}

const OrgSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    contact: {
      type: {
        email: { type: String, lowercase: true },
        phone: { type: String },
        address: { type: String },
        website: { type: String },
      },
      default: {},
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    logoPath: { type: String },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'standard', 'premium'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'paused', 'canceled'],
      default: 'trialing',
    },
    subscriptionRenewalAt: { type: Date },
    maxUsers: { type: Number, min: 0 },
    maxCoaches: { type: Number, min: 0 },
    maxEntrepreneurs: { type: Number, min: 0 },
    billingEmail: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

OrgSchema.index({ slug: 1 }, { unique: true });
OrgSchema.index({ isActive: 1 });
OrgSchema.index({ subscriptionStatus: 1 });

export const OrganizationModel = model<IOrganization>('Organization', OrgSchema);

import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
}

const OrgSchema = new Schema<IOrganization>({
  name: { type: String, required: true }
}, { timestamps: true });

export const OrganizationModel = model<IOrganization>('Organization', OrgSchema);

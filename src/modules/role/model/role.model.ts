import { Schema, model, Document, Types } from 'mongoose';
import { Permission } from '../../rbac/permissions';

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
  organizationId?: Types.ObjectId;
  isSystem: boolean;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String },
    permissions: {
      type: [String],
      default: [],
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RoleSchema.index({ slug: 1, organizationId: 1 }, { unique: true, sparse: true });

export const RoleModel = model<IRole>('Role', RoleSchema);


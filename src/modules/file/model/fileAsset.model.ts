import { Schema, model, Document, Types } from 'mongoose';

export interface IFileAsset extends Document {
  organizationId: Types.ObjectId;
  uploadedBy?: Types.ObjectId;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  tags: string[];
}

const FileAssetSchema = new Schema<IFileAsset>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

FileAssetSchema.index({ organizationId: 1, createdAt: -1 });

export const FileAssetModel = model<IFileAsset>('FileAsset', FileAssetSchema);


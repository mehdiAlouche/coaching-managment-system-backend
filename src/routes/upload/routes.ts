import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { createUploader } from '../../middleware/upload';
import { FileAssetModel } from '../../modules/file/model/fileAsset.model';

const router = Router();

const uploadMiddleware = createUploader({ subDirectory: 'general', maxFileSizeMb: 50 }).single('file');

router.post('/', requireAuth, requireSameOrganization, (req, res, next) => {
  uploadMiddleware(req, res, (err: unknown) => {
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user?.organizationId;
    const uploadedBy = authReq.user?.userId || authReq.user?._id;
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const tags = typeof req.body.tags === 'string' ? req.body.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

    const asset = await FileAssetModel.create({
      organizationId,
      uploadedBy,
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      tags,
    });

    res.status(201).json(asset);
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

router.delete('/:fileId', requireAuth, requireSameOrganization, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const organizationId = authReq.user?.organizationId;
    const { fileId } = req.params;

    const asset = await FileAssetModel.findOne({ _id: fileId, organizationId });
    if (!asset) {
      return res.status(404).json({ message: 'File not found' });
    }

    try {
      await fs.unlink(asset.path);
    } catch (err) {
      console.warn('Failed to delete file from disk:', err);
    }

    await asset.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

export default router;


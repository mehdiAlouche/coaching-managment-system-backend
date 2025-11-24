import { Router, Request, Response } from 'express';
import path from 'path';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { OrganizationModel } from '../../modules/organization/model/organization.model';
import { organizationUpdateSchema } from '../../modules/validation/schemas';
import { createUploader } from '../../middleware/upload';
import { FileAssetModel } from '../../modules/file/model/fileAsset.model';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;

      const organization = await OrganizationModel.findById(organizationId).lean();
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.json(organization);
    } catch (err) {
      console.error('Get organization error:', err);
      res.status(500).json({ message: 'Failed to fetch organization' });
    }
  }
);

router.patch(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  validate(organizationUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const updates = req.body;

      if (updates.slug) {
        updates.slug = updates.slug.toLowerCase();
      }

      const organization = await OrganizationModel.findByIdAndUpdate(organizationId, updates, { new: true });
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.json(organization);
    } catch (err) {
      console.error('Update organization error:', err);
      res.status(500).json({ message: 'Failed to update organization' });
    }
  }
);

const logoUpload = createUploader({
  subDirectory: 'organization',
  maxFileSizeMb: 5,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
}).single('logo');

router.post(
  '/logo',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  (req, res, next) => {
    logoUpload(req, res, (err: unknown) => {
      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const uploadedBy = authReq.user?.userId || authReq.user?._id;
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!file) {
        return res.status(400).json({ message: 'Logo file is required' });
      }

      const asset = await FileAssetModel.create({
        organizationId,
        uploadedBy,
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        tags: ['organization', 'logo'],
      });

      const organization = await OrganizationModel.findByIdAndUpdate(
        organizationId,
        { logoPath: path.relative(process.cwd(), file.path) },
        { new: true }
      ).lean();

      res.status(201).json({
        message: 'Organization logo updated',
        logo: organization?.logoPath,
        asset,
      });
    } catch (err) {
      console.error('Upload organization logo error:', err);
      res.status(500).json({ message: 'Failed to upload organization logo' });
    }
  }
);

export default router;


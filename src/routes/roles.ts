import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import { RoleModel } from '../modules/role/model/role.model';
import { createRoleSchema, roleParamsSchema, updateRoleSchema } from '../modules/validation/schemas';

const router = Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;

      const roles = await RoleModel.find({
        $or: [{ organizationId }, { isSystem: true }],
      })
        .sort({ name: 1 })
        .lean();

      res.json({ data: roles, count: roles.length });
    } catch (err) {
      console.error('Get roles error:', err);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  }
);

router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  validate(createRoleSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { name, description, permissions = [], slug } = req.body;

      const role = await RoleModel.create({
        name,
        description,
        permissions,
        slug: slug ? slugify(slug) : slugify(name),
        organizationId,
        isSystem: false,
      });

      res.status(201).json(role);
    } catch (err) {
      console.error('Create role error:', err);
      res.status(500).json({ message: 'Failed to create role' });
    }
  }
);

router.patch(
  '/:roleId',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  validate(updateRoleSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { roleId } = req.params;
      const { name, description, permissions, slug } = req.body;

      const role = await RoleModel.findOne({
        _id: roleId,
        $or: [{ organizationId }, { isSystem: true }],
      });

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (role.isSystem && authReq.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can modify system roles' });
      }

      if (name) role.name = name;
      if (description !== undefined) role.description = description;
      if (permissions) role.permissions = permissions;
      if (slug) role.slug = slugify(slug);

      await role.save();

      res.json(role);
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ message: 'Failed to update role' });
    }
  }
);

router.delete(
  '/:roleId',
  requireAuth,
  requireSameOrganization,
  requireRole('admin'),
  validate(roleParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { roleId } = req.params;

      const role = await RoleModel.findOne({
        _id: roleId,
        $or: [{ organizationId }, { isSystem: true }],
      });

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (role.isSystem) {
        return res.status(400).json({ message: 'System roles cannot be deleted' });
      }

      await role.deleteOne();
      res.status(204).send();
    } catch (err) {
      console.error('Delete role error:', err);
      res.status(500).json({ message: 'Failed to delete role' });
    }
  }
);

export default router;


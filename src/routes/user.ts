import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import { UserModel } from '../modules/user/model/user.model';
import { AuthRequest } from '../middleware/auth';
import { createUserSchema, updateUserSchema, userParamsSchema, userRoleUpdateSchema } from '../modules/validation/schemas';
import { buildPagination } from '../_shared/utils/pagination';
import sessionRouter from './sessions';
import goalRouter from './goals';
import paymentRouter from './payments';

const router = Router();

// Mount nested routes
router.use('/:userId/sessions', sessionRouter);
router.use('/:userId/goals', goalRouter);
router.use('/:userId/payments', paymentRouter);

// GET /users - List all active users (admin/manager only)
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { limit, page, skip, sort } = buildPagination(req.query);

      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID not found' });
      }

      const users = await UserModel.find({
        organizationId,
        isActive: true,
      })
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await UserModel.countDocuments({
        organizationId,
        isActive: true,
      });

      return res.json({
        data: users,
        meta: {
          total,
          page,
          limit,
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /users/:userId - Get one user
router.get(
  '/:userId',
  requireAuth,
  requireSameOrganization,
  validate(userParamsSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { userId } = req.params;

      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      })
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /users - Create user
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(createUserSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;

      const { email, password, role, firstName, lastName, hourlyRate, startupName, phone, timezone } = req.body;

      // Check if user already exists in this organization
      const existingUser = await UserModel.findOne({
        email,
        organizationId,
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists in your organization' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Validate role-specific fields
      if (role === 'coach' && !hourlyRate) {
        return res.status(400).json({ message: 'Hourly rate is required for coaches' });
      }

      if (role === 'entrepreneur' && !startupName) {
        return res.status(400).json({ message: 'Startup name is required for entrepreneurs' });
      }

      const user = await UserModel.create({
        email,
        password: hashedPassword,
        role,
        organizationId: new Types.ObjectId(organizationId),
        firstName,
        lastName,
        hourlyRate: role === 'coach' ? hourlyRate : undefined,
        startupName: role === 'entrepreneur' ? startupName : undefined,
        phone,
        timezone,
        isActive: true,
      });

      const userResponse = await UserModel.findById(user._id).select('-password').lean();

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PUT /users/:userId - Full update
router.put(
  '/:userId',
  requireAuth,
  requireSameOrganization,
  validate(updateUserSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { userId } = req.params;

      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { email, password, role, firstName, lastName, hourlyRate, startupName, phone, timezone, isActive } = req.body;

      // If email is being changed, check for conflicts
      if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({
          email,
          organizationId,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(409).json({ message: 'User with this email already exists' });
        }
      }

      // Update all fields
      if (email) user.email = email;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      if (role) user.role = role;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
      if (startupName !== undefined) user.startupName = startupName;
      if (phone !== undefined) user.phone = phone;
      if (timezone !== undefined) user.timezone = timezone;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      const userResponse = await UserModel.findById(user._id).select('-password').lean();

      res.json(userResponse);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /users/:userId - Partial update
router.patch(
  '/:userId',
  requireAuth,
  requireSameOrganization,
  validate(updateUserSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { userId } = req.params;

      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { email, password, firstName, lastName, hourlyRate, startupName, phone, timezone, isActive } = req.body;

      // If email is being changed, check for conflicts
      if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({
          email,
          organizationId,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(409).json({ message: 'User with this email already exists' });
        }
        user.email = email;
      }

      // Update only provided fields
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
      if (startupName !== undefined) user.startupName = startupName;
      if (phone !== undefined) user.phone = phone;
      if (timezone !== undefined) user.timezone = timezone;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      const userResponse = await UserModel.findById(user._id).select('-password').lean();

      res.json(userResponse);
    } catch (error) {
      console.error('Error patching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// PATCH /users/:userId/role - Update a user's role
router.patch(
  '/:userId/role',
  requireAuth,
  requireSameOrganization,
  validate(userRoleUpdateSchema),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { userId } = req.params;
      const { role } = req.body;

      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.role = role;
      await user.save();

      const updatedUser = await UserModel.findById(user._id).select('-password').lean();
      res.json(updatedUser);
    } catch (err) {
      console.error('Update user role error:', err);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  }
);

// DELETE /users/:userId - Soft delete (set isActive=false)
router.delete(
  '/:userId',
  requireAuth,
  requireSameOrganization,
  validate(userParamsSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const { userId } = req.params;

      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Soft delete - set isActive to false
      user.isActive = false;
      await user.save();

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;

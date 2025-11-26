import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { UserModel } from '../../modules/user/model/user.model';
import { createUserSchema } from '../../modules/validation/schemas';
import { buildPagination } from '../../_shared/utils/pagination';

const router = Router({ mergeParams: true });

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
      const { role } = req.query;

      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID not found' });
      }

      // Build query with optional role filtering
      const query: any = {
        organizationId,
        isActive: true,
      };

      // Support filtering by role: ?role=coach, ?role=entrepreneur, ?role=manager, ?role=admin
      if (role && typeof role === 'string') {
        const validRoles = ['coach', 'entrepreneur', 'manager', 'admin'];
        if (validRoles.includes(role)) {
          query.role = role;
        }
      }

      const users = await UserModel.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await UserModel.countDocuments(query);

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

// GET /users/profile - Get current user profile with role-specific data
router.get(
  '/profile',
  requireAuth,
  requireSameOrganization,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.userId || authReq.user?._id;
      const organizationId = authReq.user?.organizationId;

      if (!userId || !organizationId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user profile
      const user = await UserModel.findOne({
        _id: userId,
        organizationId,
      })
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ message: 'Internal server error' });
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

export default router;

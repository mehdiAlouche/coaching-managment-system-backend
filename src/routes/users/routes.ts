import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { requireAuth, AuthRequest } from '../../middleware/auth';
import { requireSameOrganization } from '../../middleware/organizationScope';
import { requireRole } from '../../middleware/roleCheck';
import { validate } from '../../middleware/validate';
import { UserModel } from '../../modules/user/model/user.model';
import { GoalModel } from '../../modules/goal/model/goal.model';
import { createUserSchema } from '../../modules/validation/schemas';
import { buildPagination } from '../../_shared/utils/pagination';

const router = Router({ mergeParams: true });

// GET /users - List users (admin/manager: all users, coach: their entrepreneurs only)
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const isAdmin = (authReq as any).isAdmin;
      const { limit, page, skip, sort } = buildPagination(req.query, isAdmin);
      const { role, isActive, organizationId: queryOrgId } = req.query;

      // Build query with optional filters
      const query: any = {};

      // Admins can query across all orgs or filter by specific org
      if (isAdmin) {
        // If admin specifies an org filter, apply it
        if (queryOrgId && typeof queryOrgId === 'string') {
          query.organizationId = queryOrgId;
        }
        // Otherwise, no org filter (see all users)
      } else {
        // Non-admins must filter by their organization
        if (!organizationId) {
          return res.status(400).json({ message: 'Organization ID not found' });
        }
        query.organizationId = organizationId;
      }

      // Filter by isActive status: ?isActive=true or ?isActive=false (default: return both)
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      // Support filtering by role: ?role=coach, ?role=entrepreneur, ?role=manager, ?role=admin
      if (role && typeof role === 'string') {
        const validRoles = ['coach', 'entrepreneur', 'manager', 'admin'];
        if (validRoles.includes(role)) {
          query.role = role;
        }
      }

      // Coaches can only see their entrepreneurs
      if (userRole === 'coach') {
        // Find all entrepreneurs this coach is coaching (from goals)
        const goals = await GoalModel.find({
          organizationId,
          coachId: userId,
        }).distinct('entrepreneurId');

        // Filter to only show entrepreneurs that this coach is coaching
        query._id = { $in: goals };
        query.role = 'entrepreneur'; // Force role to entrepreneur for coaches
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
      const userOrgId = authReq.user?.organizationId;
      const isAdmin = (authReq as any).isAdmin;

      const { email, password, role, organizationId, firstName, lastName, hourlyRate, startupName, phone, timezone } = req.body;

      // Determine target organization
      let targetOrgId;
      if (isAdmin && organizationId) {
        // Admin can create user for any org
        targetOrgId = organizationId;
      } else if (isAdmin && !organizationId) {
        // Admin creating admin user (no org required)
        targetOrgId = undefined;
      } else {
        // Manager can only create for their org
        targetOrgId = userOrgId;
      }

      // Validate: only admins can be created without org
      if (!targetOrgId && role !== 'admin') {
        return res.status(400).json({ message: 'Organization ID is required for non-admin users' });
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        email,
        ...(targetOrgId && { organizationId: targetOrgId }),
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' + (targetOrgId ? ' in this organization' : '') });
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
        organizationId: targetOrgId ? new Types.ObjectId(targetOrgId) : undefined,
        firstName,
        lastName,
        hourlyRate: role === 'coach' ? hourlyRate : undefined,
        startupName: role === 'entrepreneur' ? startupName : undefined,
        phone,
        timezone,
        isActive: true,
      });

      const userResponse = await UserModel.findById(user._id)
        .select('-password')
        .populate('organizationId', 'name slug')
        .lean();

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;

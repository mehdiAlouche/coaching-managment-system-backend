import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { UserModel } from '../../../modules/user/model/user.model';
import { updateUserSchema, userParamsSchema } from '../../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// GET /users/:userId - Get one user
router.get(
    '/',
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

// PATCH /users/:userId - Partial update
router.patch(
    '/',
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

// DELETE /users/:userId - Soft delete (set isActive=false)
router.delete(
    '/',
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

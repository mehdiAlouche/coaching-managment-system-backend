import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { UserModel } from '../../../../modules/user/model/user.model';
import { userRoleUpdateSchema } from '../../../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// PATCH /users/:userId/role - Update a user's role
router.patch(
    '/',
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

export default router;

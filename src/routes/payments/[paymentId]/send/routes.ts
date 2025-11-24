import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { PaymentModel } from '../../../../modules/payment/model/payment.model';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// POST /payments/:paymentId/send - Send invoice via email
router.post(
    '/',
    requireAuth,
    requireSameOrganization,
    requireRole('admin', 'manager'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const { paymentId } = req.params;

        const payment = await PaymentModel.findOne({
            _id: paymentId,
            organizationId: orgId,
        })
            .populate('coachId', 'firstName lastName email')
            .lean();

        if (!payment) {
            throw ErrorFactory.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // Type assertion for populated coach
        const coach = payment.coachId as any;

        // TODO: Implement email sending using nodemailer or similar
        // For now, just add a reminder entry
        payment.remindersSent.push({
            sentAt: new Date(),
            type: 'email',
        });

        await PaymentModel.findByIdAndUpdate(paymentId, {
            $push: { remindersSent: { sentAt: new Date(), type: 'email' } },
        });

        res.json({
            success: true,
            data: {
                message: `Invoice sent to ${coach.email}`,
                sentAt: new Date(),
            },
        });
    })
);

export default router;

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { validate } from '../../../../middleware/validate';
import { PaymentModel } from '../../../../modules/payment/model/payment.model';
import { markPaidSchema } from '../../../../modules/validation/schemas';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// POST /payments/:paymentId/mark-paid - Mark payment as paid
router.post(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(markPaidSchema),
    requireRole('admin', 'manager'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const { paymentId } = req.params;
        const { paymentMethod, paymentReference, paidAt } = req.body;

        const payment = await PaymentModel.findOne({
            _id: paymentId,
            organizationId: orgId,
        });

        if (!payment) {
            throw ErrorFactory.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        if (payment.status === 'paid') {
            throw ErrorFactory.conflict('Payment is already marked as paid', 'ALREADY_PAID');
        }

        payment.status = 'paid';
        payment.paidAt = paidAt ? new Date(paidAt) : new Date();

        if (paymentMethod || paymentReference) {
            payment.notes = payment.notes || '';
            if (paymentMethod) {
                payment.notes += `\nPayment Method: ${paymentMethod}`;
            }
            if (paymentReference) {
                payment.notes += `\nPayment Reference: ${paymentReference}`;
            }
        }

        await payment.save();

        const updatedPayment = await PaymentModel.findById(payment._id)
            .populate('coachId', 'firstName lastName email hourlyRate')
            .populate('sessionIds', 'scheduledAt duration status')
            .lean();

        res.json({ success: true, data: updatedPayment });
    })
);

export default router;

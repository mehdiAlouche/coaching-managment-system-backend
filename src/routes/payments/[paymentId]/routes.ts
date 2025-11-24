import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { PaymentModel } from '../../../modules/payment/model/payment.model';
import { updatePaymentSchema, paymentParamsSchema } from '../../../modules/validation/schemas';

const router = Router({ mergeParams: true });

// GET /payments/:paymentId - Get one payment/invoice
router.get(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(paymentParamsSchema),
    requireRole('admin', 'manager', 'coach'),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const orgId = authReq.user?.organizationId;
            const userId = authReq.user?.userId || authReq.user?._id;
            const userRole = authReq.user?.role;
            const { paymentId } = req.params;

            const payment = await PaymentModel.findOne({
                _id: paymentId,
                organizationId: orgId,
            })
                .populate('coachId', 'firstName lastName email hourlyRate phone')
                .populate('sessionIds')
                .lean();

            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            // Coaches can only see their own payments
            if (userRole === 'coach' && payment.coachId.toString() !== userId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }

            res.json(payment);
        } catch (err) {
            console.error('Get payment error:', err);
            res.status(500).json({ message: 'Failed to fetch payment' });
        }
    }
);

// PATCH /payments/:paymentId - Update payment (mark paid, etc.)
router.patch(
    '/',
    requireAuth,
    requireSameOrganization,
    validate(updatePaymentSchema),
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const orgId = authReq.user?.organizationId;
            const { paymentId } = req.params;

            const payment = await PaymentModel.findOne({
                _id: paymentId,
                organizationId: orgId,
            });

            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            const { status, invoiceUrl, paidAt, remindersSent, notes } = req.body;

            // Update only provided fields
            if (status) {
                payment.status = status;
                if (status === 'paid' && !payment.paidAt) {
                    payment.paidAt = paidAt ? new Date(paidAt) : new Date();
                }
            }
            if (invoiceUrl !== undefined) payment.invoiceUrl = invoiceUrl;
            if (paidAt !== undefined) payment.paidAt = paidAt ? new Date(paidAt) : undefined;
            if (remindersSent) {
                payment.remindersSent = [...payment.remindersSent, ...remindersSent];
            }
            if (notes !== undefined) payment.notes = notes;

            await payment.save();

            const updatedPayment = await PaymentModel.findById(payment._id)
                .populate('coachId', 'firstName lastName email hourlyRate')
                .populate('sessionIds', 'scheduledAt duration status')
                .lean();

            res.json(updatedPayment);
        } catch (err) {
            console.error('Patch payment error:', err);
            res.status(500).json({ message: 'Failed to update payment' });
        }
    }
);

export default router;

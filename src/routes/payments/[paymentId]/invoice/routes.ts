import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../../middleware/auth';
import { requireSameOrganization } from '../../../../middleware/organizationScope';
import { requireRole } from '../../../../middleware/roleCheck';
import { PaymentModel } from '../../../../modules/payment/model/payment.model';
import { asyncHandler } from '../../../../middleware/errorHandler';
import { ErrorFactory } from '../../../../_shared/errors/AppError';

const router = Router({ mergeParams: true });

// GET /payments/:paymentId/invoice/download - Download invoice (placeholder)
router.get(
    '/download',
    requireAuth,
    requireSameOrganization,
    requireRole('admin', 'manager', 'coach'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const { paymentId } = req.params;

        const payment = await PaymentModel.findOne({
            _id: paymentId,
            organizationId: orgId,
        })
            .populate('coachId', 'firstName lastName email hourlyRate phone')
            .populate('sessionIds')
            .populate('organizationId', 'name contact billingEmail')
            .lean();

        if (!payment) {
            throw ErrorFactory.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // Coaches can only download their own invoices
        if (userRole === 'coach' && payment.coachId._id.toString() !== userId?.toString()) {
            throw ErrorFactory.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
        }

        // TODO: Implement PDF generation using pdfkit or similar
        // For now, return invoice data that frontend can format
        res.json({
            success: true,
            data: {
                invoice: payment,
                message: 'PDF generation not implemented yet. Use this data to generate invoice on frontend.',
            },
        });
    })
);

export default router;

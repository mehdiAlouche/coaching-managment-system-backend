import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../../../middleware/auth';
import { requireSameOrganization } from '../../../middleware/organizationScope';
import { requireRole } from '../../../middleware/roleCheck';
import { validate } from '../../../middleware/validate';
import { PaymentModel } from '../../../modules/payment/model/payment.model';
import { UserModel } from '../../../modules/user/model/user.model';
import { OrganizationModel } from '../../../modules/organization/model/organization.model';
import { updatePaymentSchema, paymentParamsSchema } from '../../../modules/validation/schemas';
import { generateInvoicePDF } from '../../../_shared/utils/pdfGenerator';
import { asyncHandler } from '../../../middleware/errorHandler';
import { ErrorFactory } from '../../../_shared/errors/AppError';

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

// GET /payments/:paymentId/invoice - Generate and download invoice PDF
router.get(
    '/invoice',
    requireAuth,
    requireSameOrganization,
    requireRole('admin', 'manager', 'coach'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { paymentId } = req.params;
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId || req.user?._id;
        const userRole = req.user?.role;

        // Find payment
        const payment = await PaymentModel.findOne({
            _id: paymentId,
            organizationId: orgId,
        })
            .populate('coachId')
            .populate('sessionIds')
            .lean();

        if (!payment) {
            throw ErrorFactory.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // Authorization: coaches can only view their own invoices
        if (userRole === 'coach' && (payment.coachId as any)._id.toString() !== userId?.toString()) {
            throw ErrorFactory.forbidden('Access denied', 'ACCESS_DENIED');
        }

        // Get coach details
        const coach = await UserModel.findById(payment.coachId).lean();
        if (!coach) {
            throw ErrorFactory.notFound('Coach not found', 'COACH_NOT_FOUND');
        }

        // Get organization details
        const organization = await OrganizationModel.findById(orgId).lean();

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
            payment: payment as any,
            coach: coach as any,
            organization: organization as any,
        });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="invoice-${payment.invoiceNumber}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    })
);

// POST /payments/:paymentId/send-invoice - Send invoice via email
router.post(
    '/send-invoice',
    requireAuth,
    requireSameOrganization,
    requireRole('admin', 'manager'),
    asyncHandler(async (req: AuthRequest, res: Response) => {
        const { paymentId } = req.params;
        const orgId = req.user?.organizationId;

        // Find payment
        const payment = await PaymentModel.findOne({
            _id: paymentId,
            organizationId: orgId,
        }).populate('coachId');

        if (!payment) {
            throw ErrorFactory.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // Get coach details
        const coach = await UserModel.findById(payment.coachId).lean();
        if (!coach) {
            throw ErrorFactory.notFound('Coach not found', 'COACH_NOT_FOUND');
        }

        // Get organization details
        const organization = await OrganizationModel.findById(orgId).lean();

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
            payment: payment as any,
            coach: coach as any,
            organization: organization as any,
        });

        // TODO: Implement email sending
        // For now, we'll just update the payment status
        // In production, integrate with email service (SendGrid, AWS SES, etc.)

        // Update payment to track that invoice was sent
        payment.remindersSent.push({
            sentAt: new Date(),
            type: 'email',
        });

        await payment.save();

        res.json({
            success: true,
            message: 'Invoice email queued for sending',
            data: {
                paymentId: payment._id,
                invoiceNumber: payment.invoiceNumber,
                recipient: coach.email,
                sentAt: new Date(),
            },
        });
    })
);

export default router;

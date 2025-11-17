import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/auth';
import { requireSameOrganization } from '../middleware/organizationScope';
import { requireRole } from '../middleware/roleCheck';
import { validate } from '../middleware/validate';
import { PaymentModel } from '../modules/payment/model/payment.model';
import { SessionModel } from '../modules/session/model/session.model';
import { UserModel } from '../modules/user/model/user.model';
import { AuthRequest } from '../middleware/auth';
import { createPaymentSchema, updatePaymentSchema, paymentParamsSchema } from '../modules/validation/schemas';
import { buildPagination } from '../_shared/utils/pagination';

const router = Router();

// GET /payments - List all payments with optional filters
router.get(
  '/',
  requireAuth,
  requireSameOrganization,
  requireRole('admin', 'manager', 'coach'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;
      const userId = authReq.user?.userId || authReq.user?._id;
      const userRole = authReq.user?.role;
      const { limit, page, skip, sort } = buildPagination(req.query);

      // Build query filters
      const query: any = { organizationId: orgId };

      // Coaches can only see their own payments
      if (userRole === 'coach') {
        query.coachId = userId;
      }

      // Filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }

      const payments = await PaymentModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('coachId', 'firstName lastName email hourlyRate')
        .populate('sessionIds', 'scheduledAt duration status')
        .lean();

      const total = await PaymentModel.countDocuments(query);

      res.json({ data: payments, meta: { total, page, limit } });
    } catch (err) {
      console.error('Get payments error:', err);
      res.status(500).json({ message: 'Failed to fetch payments' });
    }
  }
);

// GET /payments/:paymentId - Get one payment/invoice
router.get(
  '/:paymentId',
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

// POST /payments - Create invoice
router.post(
  '/',
  requireAuth,
  requireSameOrganization,
  validate(createPaymentSchema),
  requireRole('admin', 'manager'),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const orgId = authReq.user?.organizationId;

      const { coachId, sessionIds, amount, taxAmount, currency, dueDate, period, notes } = req.body;

      // Verify coach belongs to the organization
      const coach = await UserModel.findOne({ _id: coachId, organizationId: orgId, role: 'coach' });
      if (!coach) {
        return res.status(400).json({ message: 'Invalid coach ID' });
      }

      // Verify all sessions belong to the organization and are completed
      const sessions = await SessionModel.find({
        _id: { $in: sessionIds },
        organizationId: orgId,
        coachId: coachId,
        status: 'completed',
      });

      if (sessions.length !== sessionIds.length) {
        return res.status(400).json({ message: 'Some sessions are invalid or not completed' });
      }

      // Check if sessions are already paid
      const existingPayments = await PaymentModel.find({
        organizationId: orgId,
        sessionIds: { $in: sessionIds },
        status: { $in: ['pending', 'paid'] },
      });

      if (existingPayments.length > 0) {
        return res.status(409).json({ message: 'Some sessions are already included in a payment' });
      }

      // Generate invoice number (simple incrementing format)
      const lastPayment = await PaymentModel.findOne({ organizationId: orgId })
        .sort({ createdAt: -1 })
        .select('invoiceNumber')
        .lean();

      let invoiceNumber = 'INV-001';
      if (lastPayment?.invoiceNumber) {
        const match = lastPayment.invoiceNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10) + 1;
          invoiceNumber = `INV-${num.toString().padStart(3, '0')}`;
        }
      }

      // Build line items from sessions
      const hourlyRate = coach.hourlyRate || 0;
      const lineItems = sessions.map((session) => ({
        sessionId: session._id,
        description: `Session on ${session.scheduledAt.toISOString()}`,
        duration: session.duration,
        rate: hourlyRate,
        amount: hourlyRate * (session.duration / 60),
      }));

      // Calculate total if not provided
      const calculatedAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const finalAmount = amount || calculatedAmount;
      const finalTaxAmount = taxAmount || 0;
      const totalAmount = finalAmount + finalTaxAmount;

      const payment = await PaymentModel.create({
        organizationId: orgId,
        coachId: new Types.ObjectId(coachId),
        sessionIds: sessionIds.map((id: string) => new Types.ObjectId(id)),
        lineItems,
        amount: finalAmount,
        taxAmount: finalTaxAmount,
        totalAmount,
        currency: currency || 'USD',
        status: 'pending',
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        period: period
          ? {
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
            }
          : undefined,
        remindersSent: [],
        notes,
      });

      // Update sessions with payment reference
      await SessionModel.updateMany(
        { _id: { $in: sessionIds } },
        { $set: { paymentId: payment._id } }
      );

      const populatedPayment = await PaymentModel.findById(payment._id)
        .populate('coachId', 'firstName lastName email hourlyRate')
        .populate('sessionIds', 'scheduledAt duration status')
        .lean();

      res.status(201).json(populatedPayment);
    } catch (err) {
      console.error('Create payment error:', err);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  }
);

// PATCH /payments/:paymentId - Update payment (mark paid, etc.)
router.patch(
  '/:paymentId',
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


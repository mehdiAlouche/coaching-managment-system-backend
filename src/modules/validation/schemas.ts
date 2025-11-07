import { z } from 'zod';
import { UserRole } from '../../_shared/enums/userRoles';

// Common schemas
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform(email => email.toLowerCase());

// Auth schemas
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['manager', 'coach', 'entrepreneur', 'admin'] as const),
    organizationId: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    startupName: z.string().optional(),
    hourlyRate: z.number().positive().optional(),
    phone: z.string().optional(),
    timezone: z.string().optional(),
  }),
});

// Goal schemas
export const createGoalSchema = z.object({
  body: z.object({
    entrepreneurId: z.string(),
    coachId: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
    priority: z.enum(['low', 'medium', 'high']),
    targetDate: z.string().datetime().optional(),
    milestones: z
      .array(
        z.object({
          title: z.string().min(1, 'Milestone title is required'),
          status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
          targetDate: z.string().datetime().optional(),
          notes: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createGoalSchema.shape.body.partial(),
});

// Session schemas
export const createSessionSchema = z.object({
  body: z.object({
    coachId: z.string(),
    entrepreneurId: z.string(),
    managerId: z.string(),
    scheduledAt: z.string().datetime(),
    duration: z.number().int().positive(),
    agendaItems: z
      .array(
        z.object({
          title: z.string().min(1, 'Agenda item title is required'),
          description: z.string().optional(),
          duration: z.number().int().positive().optional(),
        })
      )
      .optional(),
    location: z.string().optional(),
    videoConferenceUrl: z.string().url().optional(),
  }),
});

export const updateSessionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createSessionSchema.shape.body.partial(),
});

// Payment schemas
export const createPaymentSchema = z.object({
  body: z.object({
    coachId: z.string(),
    sessionIds: z.array(z.string()),
    amount: z.number().positive(),
    taxAmount: z.number().min(0),
    currency: z.string().length(3),
    dueDate: z.string().datetime(),
    period: z
      .object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createPaymentSchema.shape.body.partial(),
});
import { z } from 'zod';

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
    goalId: z.string(),
  }),
  body: createGoalSchema.shape.body.partial(),
});

export const goalParamsSchema = z.object({
  params: z.object({
    goalId: z.string(),
  }),
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
    sessionId: z.string(),
  }),
  body: createSessionSchema.shape.body.partial(),
});

export const sessionParamsSchema = z.object({
  params: z.object({
    sessionId: z.string(),
  }),
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
    paymentId: z.string(),
  }),
  body: z.object({
    status: z.enum(['pending', 'paid', 'failed', 'refunded', 'void']).optional(),
    invoiceUrl: z.string().url().optional(),
    paidAt: z.string().datetime().optional(),
    remindersSent: z
      .array(
        z.object({
          sentAt: z.string().datetime(),
          type: z.enum(['email', 'sms', 'in_app']),
        })
      )
      .optional(),
    notes: z.string().optional(),
  }),
});

export const paymentParamsSchema = z.object({
  params: z.object({
    paymentId: z.string(),
  }),
});

// User schemas
export const createUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['manager', 'coach', 'entrepreneur', 'admin'] as const),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    hourlyRate: z.number().positive().optional(),
    startupName: z.string().optional(),
    phone: z.string().optional(),
    timezone: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
  body: createUserSchema.shape.body.partial().extend({
    password: passwordSchema.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userParamsSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
});

export const userRoleUpdateSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
  body: z.object({
    role: z.enum(['manager', 'coach', 'entrepreneur', 'admin'] as const),
  }),
});

// Organization schemas
export const organizationUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    billingEmail: emailSchema.optional(),
    contact: z
      .object({
        email: emailSchema.optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        website: z.string().url().optional(),
      })
      .optional(),
    settings: z.record(z.string(), z.any()).optional(),
    preferences: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Roles schemas
const roleBodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const createRoleSchema = z.object({
  body: roleBodySchema,
});

export const updateRoleSchema = z.object({
  params: z.object({
    roleId: z.string(),
  }),
  body: roleBodySchema.partial(),
});

export const roleParamsSchema = z.object({
  params: z.object({
    roleId: z.string(),
  }),
});

// Session notes
export const sessionNoteSchema = z.object({
  params: z.object({
    sessionId: z.string(),
  }),
  body: z.object({
    summary: z.string().min(1, 'Summary is required'),
    details: z.string().optional(),
    visibility: z.enum(['internal', 'shared']).optional(),
    followUpTasks: z
      .array(
        z.object({
          description: z.string().min(1),
          dueDate: z.string().datetime().optional(),
          completed: z.boolean().optional(),
        })
      )
      .optional(),
    attendance: z
      .object({
        present: z.boolean(),
        notes: z.string().optional(),
      })
      .optional(),
  }),
});

// Notifications
export const notificationParamsSchema = z.object({
  params: z.object({
    notificationId: z.string(),
  }),
});

// Session extensions
export const sessionStatusSchema = z.object({
  params: z.object({
    sessionId: z.string(),
  }),
  body: z.object({
    status: z.enum(['scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show']),
  }),
});

export const sessionConflictSchema = z.object({
  body: z.object({
    coachId: z.string(),
    scheduledAt: z.string().datetime(),
    duration: z.number().int().positive(),
    excludeSessionId: z.string().optional(),
  }),
});

export const sessionRatingSchema = z.object({
  params: z.object({
    sessionId: z.string(),
  }),
  body: z.object({
    score: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const sessionNotesUpdateSchema = z.object({
  params: z.object({
    sessionId: z.string(),
  }),
  body: z.object({
    role: z.enum(['coach', 'entrepreneur', 'manager']),
    notes: z.string().min(1),
  }),
});

// Goal extensions
export const goalProgressSchema = z.object({
  params: z.object({
    goalId: z.string(),
  }),
  body: z.object({
    progress: z.number().int().min(0).max(100),
  }),
});

export const milestoneUpdateSchema = z.object({
  params: z.object({
    goalId: z.string(),
    milestoneId: z.string(),
  }),
  body: z.object({
    status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
    notes: z.string().optional(),
  }),
});

export const goalCommentSchema = z.object({
  params: z.object({
    goalId: z.string(),
  }),
  body: z.object({
    text: z.string().min(1),
  }),
});

export const goalCollaboratorSchema = z.object({
  params: z.object({
    goalId: z.string(),
  }),
  body: z.object({
    userId: z.string(),
    role: z.string().optional(),
  }),
});

export const goalSessionLinkSchema = z.object({
  params: z.object({
    goalId: z.string(),
    sessionId: z.string(),
  }),
});

// Payment extensions
export const generatePaymentSchema = z.object({
  body: z.object({
    coachId: z.string(),
    sessionIds: z.array(z.string()).min(1),
    notes: z.string().optional(),
  }),
});

export const markPaidSchema = z.object({
  params: z.object({
    paymentId: z.string(),
  }),
  body: z.object({
    paymentMethod: z.string().optional(),
    paymentReference: z.string().optional(),
    paidAt: z.string().datetime().optional(),
  }),
});
# Multi-Tenant Database Schema

## Overview
This system implements **organization-scoped multi-tenancy** where data is isolated per organization using `organizationId` references.

## ✅ Schema Status

### Properly Scoped Models (Required organizationId)

| Model | organizationId | Indexed | Data Isolation |
|-------|---------------|---------|----------------|
| **Goal** | ✅ Required | ✅ `{ organizationId: 1, entrepreneurId: 1 }` | Full |
| **Session** | ✅ Required | ✅ `{ organizationId: 1, scheduledAt: 1 }` | Full |
| **SessionNote** | ✅ Required | ✅ `{ organizationId: 1, sessionId: 1, createdAt: -1 }` | Full |
| **Payment** | ✅ Required | ✅ `{ organizationId: 1, coachId: 1 }` | Full |
| **Notification** | ✅ Required | ✅ `{ organizationId: 1, userId: 1, createdAt: -1 }` | Full |
| **FileAsset** | ✅ Required | ✅ `{ organizationId: 1, createdAt: -1 }` | Full |

### Partially Scoped Models (Optional organizationId)

| Model | organizationId | Reason | Notes |
|-------|---------------|--------|-------|
| **User** | ⚠️ Optional | Super-admin support | Regular users MUST have organizationId. Only system super-admins can omit it. |
| **Role** | ⚠️ Optional | System roles | Custom roles MUST have organizationId. System roles (like super-admin) can omit it. |

### Not Scoped (Top-level entities)

| Model | organizationId | Reason |
|-------|---------------|--------|
| **Organization** | ❌ N/A | Top-level tenant entity |

## 🔒 Data Isolation Strategy

### 1. Database Level
All organization-scoped models include:
```typescript
organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
```

### 2. Index Level
Every scoped model has compound indexes:
```typescript
// Examples:
GoalSchema.index({ organizationId: 1, entrepreneurId: 1 });
SessionSchema.index({ organizationId: 1, scheduledAt: 1 });
PaymentSchema.index({ organizationId: 1, coachId: 1 });
UserSchema.index({ role: 1, organizationId: 1 });
```

### 3. Middleware Level
The `organizationScope` middleware (`src/middleware/organizationScope.ts`) automatically:
- Extracts `organizationId` from authenticated user
- Filters all queries by organization
- Prevents cross-organization data access

### 4. Query Level
All service queries MUST include organizationId:
```typescript
// ✅ CORRECT
await GoalModel.find({ 
  organizationId: req.user.organizationId,
  entrepreneurId: entrepreneurId 
});

// ❌ WRONG - Missing organizationId
await GoalModel.find({ 
  entrepreneurId: entrepreneurId 
});
```

## 📊 Schema Details

### Goal
```typescript
{
  organizationId: ObjectId,      // Required
  entrepreneurId: ObjectId,      // Required
  coachId: ObjectId,             // Required
  title: string,
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked',
  priority: 'low' | 'medium' | 'high',
  progress: number,              // 0-100
  milestones: [{
    title: string,
    status: GoalStatus,
    targetDate?: Date,
    completedAt?: Date
  }],
  collaborators: [{ userId, role, addedAt }],
  comments: [{ userId, comment, createdAt }]
}
```

### Session
```typescript
{
  organizationId: ObjectId,      // Required
  coachId: ObjectId,             // Required
  entrepreneurId: ObjectId,      // Required
  managerId?: ObjectId,
  scheduledAt: Date,
  duration: number,              // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show',
  rating?: {
    score: number,               // 1-5
    comment?: string,
    feedback?: string,
    submittedBy: ObjectId,
    submittedAt: Date
  },
  paymentId?: ObjectId,
  agendaItems: [{ title, description, duration }],
  notes: { summary, actionItems, privateNotes }
}
```

### SessionNote
```typescript
{
  organizationId: ObjectId,      // Required
  sessionId: ObjectId,           // Required
  authorId: ObjectId,            // Required (coach)
  noteType: 'summary' | 'action_item' | 'observation' | 'follow_up',
  content: string,
  visibility: 'private' | 'shared_with_entrepreneur' | 'shared_with_team',
  tags: string[],
  linkedGoals: ObjectId[]
}
```

### Payment
```typescript
{
  organizationId: ObjectId,      // Required
  coachId: ObjectId,             // Required
  sessionIds: ObjectId[],
  lineItems: [{
    sessionId: ObjectId,
    description: string,
    duration: number,
    rate: number,
    amount: number
  }],
  amount: number,
  taxAmount: number,
  totalAmount: number,
  currency: string,
  status: 'pending' | 'paid' | 'overdue' | 'cancelled',
  invoiceNumber: string,
  dueDate: Date,
  paidAt?: Date,
  paymentMethod?: string,
  transactionId?: string
}
```

### Notification
```typescript
{
  organizationId: ObjectId,      // Required
  userId: ObjectId,              // Required
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  isRead: boolean,
  relatedEntity?: { type: string, id: ObjectId },
  actionUrl?: string
}
```

### FileAsset
```typescript
{
  organizationId: ObjectId,      // Required
  uploadedBy?: ObjectId,
  originalName: string,
  filename: string,
  mimetype: string,
  size: number,
  path: string,
  tags: string[]
}
```

### User
```typescript
{
  email: string,
  password: string,              // hashed
  role: 'manager' | 'coach' | 'entrepreneur' | 'admin',
  organizationId?: ObjectId,     // Optional for super-admins
  isActive: boolean,
  firstName?: string,
  lastName?: string,
  hourlyRate?: number,           // Coaches only
  startupName?: string,          // Entrepreneurs only
  phone?: string,
  timezone?: string
}

// Indexes:
// { email: 1, organizationId: 1 } - unique, sparse
// { role: 1, organizationId: 1 }
// { organizationId: 1, isActive: 1 }
```

### Role (Custom RBAC)
```typescript
{
  name: string,
  slug: string,
  description?: string,
  permissions: Permission[],
  organizationId?: ObjectId,     // Optional for system roles
  isSystem: boolean
}

// Index: { slug: 1, organizationId: 1 } - unique, sparse
```

### Organization
```typescript
{
  name: string,
  slug: string,                  // Unique identifier
  isActive: boolean,
  settings: {
    timezone?: string,
    locale?: string,
    taxRate?: number,
    notificationPreferences?: object
  },
  contact?: {
    email?: string,
    phone?: string,
    address?: string,
    website?: string
  },
  subscriptionPlan: 'free' | 'standard' | 'premium',
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled',
  maxUsers?: number,
  maxCoaches?: number,
  maxEntrepreneurs?: number,
  billingEmail?: string
}

// Indexes:
// { slug: 1 } - unique
// { isActive: 1 }
// { subscriptionStatus: 1 }
```

## 🔐 Access Control Rules

### By Role

| Role | Organization Scope | Access Level |
|------|-------------------|--------------|
| **Super Admin** | Cross-org | Full system access, can manage organizations |
| **Admin** | Single org | Full access to all org data |
| **Manager** | Single org | Manage users, sessions, view all data |
| **Coach** | Single org | Own sessions, payments, assigned goals |
| **Entrepreneur** | Single org | Own sessions, goals, startup data |

### Query Filtering

Every endpoint automatically filters by organization:

```typescript
// Middleware: src/middleware/organizationScope.ts
router.use(requireAuth, requireSameOrganization, ...);

// Service Layer - Example
async findGoals(userId: string, organizationId: string) {
  return GoalModel.find({
    organizationId,                    // Always include
    entrepreneurId: userId
  });
}
```

## 🛡️ Security Considerations

### 1. Prevent Cross-Organization Access
```typescript
// ✅ SECURE - Uses middleware
router.get('/goals', requireAuth, requireSameOrganization, async (req, res) => {
  const goals = await GoalModel.find({
    organizationId: req.user.organizationId
  });
});

// ❌ INSECURE - Missing organization filter
router.get('/goals', requireAuth, async (req, res) => {
  const goals = await GoalModel.find({}); // Returns ALL organizations!
});
```

### 2. Validate Organization Membership
```typescript
// Check if user belongs to the same organization as the resource
const session = await SessionModel.findOne({
  _id: sessionId,
  organizationId: req.user.organizationId  // Critical
});

if (!session) {
  return res.status(404).json({ error: 'Session not found' });
}
```

### 3. File Upload Isolation
```typescript
// Store files in organization-specific folders
const uploadPath = `uploads/organization/${organizationId}/${filename}`;
```

## 📈 Performance Optimization

### Index Strategy
All organization-scoped queries use compound indexes:
```typescript
// Most common query patterns
{ organizationId: 1, entrepreneurId: 1 }     // Goals by entrepreneur
{ organizationId: 1, coachId: 1 }            // Sessions/payments by coach
{ organizationId: 1, scheduledAt: 1 }        // Sessions by date
{ organizationId: 1, userId: 1, createdAt: -1 } // Notifications
{ role: 1, organizationId: 1 }               // Users by role
```

### Query Performance
- **O(log n)** lookups using indexed organizationId
- No table scans for organization-filtered queries
- Efficient pagination with compound indexes

## 🧪 Testing Multi-Tenancy

### Seed Data (src/seeds/seed.ts)
The seed creates two organizations:
```typescript
- Riverbank Startup Hub (riverbank-hub)
  └── Manager: alice.manager@riverbank.example
  └── Coach: ben.coach@riverbank.example
  └── Entrepreneur: cara.startup@riverbank.example

- Northside Accelerator (northside-accelerator)
  └── Manager: david.manager@northside.example
  └── Coach: emma.coach@northside.example
  └── Entrepreneur: felix.startup@northside.example
```

### Isolation Tests
```bash
# Test 1: Users from org1 cannot access org2 data
curl -H "Authorization: Bearer <org1-token>" \
  http://localhost:5000/api/v1/sessions
# Should return ONLY org1 sessions

# Test 2: Direct ID access across organizations
curl -H "Authorization: Bearer <org1-token>" \
  http://localhost:5000/api/v1/sessions/<org2-session-id>
# Should return 404 (not 403 to avoid leaking existence)

# Test 3: Role filtering within organization
curl -H "Authorization: Bearer <manager-token>" \
  "http://localhost:5000/api/v1/users?role=coach"
# Should return only coaches from manager's organization
```

## 🚀 Migration Checklist

When adding new models:
- [ ] Add `organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }`
- [ ] Add compound index with `organizationId` as first field
- [ ] Update service layer to always filter by `organizationId`
- [ ] Apply `requireSameOrganization` middleware to routes
- [ ] Add organization filtering tests
- [ ] Update seed data with multi-org examples

## 📚 Related Files
- Schema definitions: `src/modules/*/model/*.model.ts`
- Organization middleware: `src/middleware/organizationScope.ts`
- Auth middleware: `src/middleware/auth.ts`
- Seed data: `src/seeds/seed.ts`
- RBAC guide: `RBAC_GUIDE.md`

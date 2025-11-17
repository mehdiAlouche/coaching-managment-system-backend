# Role-Based Access Control (RBAC) Documentation

## 📋 Overview

This backend implements a comprehensive Role-Based Access Control (RBAC) system that restricts API endpoints based on user roles. All protected endpoints enforce role-based permissions.

## 🎯 Roles and Their Permissions

### 1. **Admin** 🔑
**Super Admin** - Full access to all resources and management features
- **Permissions**: All permissions
- **Access**: Every endpoint
- **Use Case**: Platform administrators, system maintenance, complete system control

**Permissions:**
```
✓ read:sessions, create:session, update:session, delete:session
✓ read:goals, create:goal, update:goal, delete:goal
✓ read:payments, create:payment, update:payment
✓ read:users, manage:users
✓ read:dashboard
✓ read:organization, manage:organization
```

### 2. **Manager** 👔
**Organization Manager** - Can manage organization, view all data, and oversee operations
- **Permissions**: Read-heavy with some creation ability
- **Access**: Most endpoints except delete operations
- **Use Case**: Organization administrators, coaches oversight, business intelligence

**Permissions:**
```
✓ read:sessions, create:session, update:session
✓ read:goals
✓ read:payments
✓ read:users
✓ read:dashboard
✓ read:organization
✗ Cannot delete anything or create payments
```

### 3. **Coach** 🎓
**Coaching Professional** - Can create and manage sessions, view goals, and see organization data
- **Permissions**: Create/read, limited update
- **Access**: Sessions, goals (read/update), dashboard
- **Use Case**: Coaches running sessions, managing client relationships

**Permissions:**
```
✓ read:sessions, create:session, update:session
✓ read:goals, update:goal
✓ read:payments
✓ read:users
✓ read:dashboard
✗ Cannot delete, cannot create goals/payments
```

### 4. **Entrepreneur** 👨‍💼
**Startup Founder/Client** - Can view own sessions and goals, update personal goals
- **Permissions**: Minimal access, self-service only
- **Access**: View sessions, goals (read/update), own profile
- **Use Case**: Startup founders receiving coaching

**Permissions:**
```
✓ read:sessions, read:goals, update:goal
✓ read:payments
✗ Cannot create or delete anything
✗ Cannot manage other users
```

---

## 🔐 Endpoint Access Matrix

| Endpoint | GET | POST | PATCH | DELETE | Min Role |
|----------|-----|------|-------|--------|----------|
| `/auth/register` | - | ✓ Public | - | - | Public |
| `/auth/login` | - | ✓ Public | - | - | Public |
| `/auth/me` | ✓ Auth | - | - | - | Authenticated |
| `/sessions` | ✓ All | ✓ Admin/Manager/Coach | ✓ Admin/Manager/Coach | ✓ Admin/Manager | Admin/Manager |
| `/goals` | ✓ All | ✓ Admin/Manager/Coach | ✓ All | ✓ Admin/Manager | Admin/Manager |
| `/payments` | ✓ Admin/Manager/Coach | ✓ Admin/Manager | ✓ Admin/Manager | - | Admin/Manager |
| `/users` | ✓ Admin/Manager | ✓ Admin/Manager | ✓ Admin/Manager | ✓ Admin | Admin/Manager |
| `/dashboard/stats` | ✓ Admin/Manager/Coach | - | - | - | Admin/Manager |

---

## 🚀 Implementation Details

### How RBAC Works

1. **Authentication**: User logs in and receives JWT with their role included
2. **Authorization**: Each protected endpoint checks the user's role
3. **Middleware Chain**: `requireAuth` → `requireSameOrganization` → `requireRole(roles...)`
4. **Response**: If role doesn't match, returns 403 Forbidden

### Error Responses

**Insufficient Role (403 Forbidden):**
```json
{
  "message": "Access denied",
  "details": "Required role: one of [admin, manager], but you are: entrepreneur"
}
```

**Example Scenarios:**

**Scenario 1: Entrepreneur tries to list users**
```bash
GET /api/v1/users
Authorization: Bearer <entrepreneur_token>
```
Response:
```json
{
  "message": "Access denied",
  "details": "Required role: one of [admin, manager], but you are: entrepreneur"
}
```

**Scenario 2: Coach tries to delete a session**
```bash
DELETE /api/v1/sessions/507f1f77bcf86cd799439020
Authorization: Bearer <coach_token>
```
Response:
```json
{
  "message": "Access denied",
  "details": "Required role: one of [admin, manager], but you are: coach"
}
```

---

## 📝 Usage Examples

### 1. Login as Different Roles

**Manager Login:**
```bash
POST /api/v1/auth/login
{
  "email": "alice.manager@riverbank.example",
  "password": "ManagerPass1!"
}
```

**Coach Login:**
```bash
POST /api/v1/auth/login
{
  "email": "ben.coach@riverbank.example",
  "password": "CoachPass1!"
}
```

**Entrepreneur Login:**
```bash
POST /api/v1/auth/login
{
  "email": "cara.startup@riverbank.example",
  "password": "Entrepreneur1!"
}
```

### 2. Access Control Examples

**Manager can list users (✓ Success):**
```bash
GET /api/v1/users
Authorization: Bearer <manager_token>
```

**Coach cannot list users (✗ 403 Forbidden):**
```bash
GET /api/v1/users
Authorization: Bearer <coach_token>
```

**Entrepreneur cannot delete sessions (✗ 403 Forbidden):**
```bash
DELETE /api/v1/sessions/507f1f77bcf86cd799439020
Authorization: Bearer <entrepreneur_token>
```

---

## 🔧 Developers: Using RBAC in Code

### Import RBAC Utilities

```typescript
import { requireRole } from '../middleware/roleCheck';
import { 
  hasPermission, 
  canAccessEndpoint,
  getRoleDescription,
  type RoleType,
  type Permission
} from '../modules/rbac/permissions';
```

### Apply Role Check to a Route

```typescript
router.post(
  '/special-endpoint',
  requireAuth,
  requireRole('admin', 'manager'),  // Only these roles
  controller.handler
);
```

### Check Permissions in Code

```typescript
import { hasPermission } from '../modules/rbac/permissions';

if (hasPermission(userRole, 'create:session')) {
  // User can create sessions
}
```

### Get Role Description

```typescript
import { getRoleDescription } from '../modules/rbac/permissions';

console.log(getRoleDescription('manager'));
// Output: "Manager - Can manage organization, view all data, and oversee operations"
```

---

## 🛡️ Security Best Practices

1. **Always use `requireAuth` first** - Ensures user is authenticated
2. **Use `requireRole` after organization scope** - Chain: auth → org scope → role
3. **Principle of Least Privilege** - Assign minimum necessary roles
4. **Never trust client-side role checks** - Always verify server-side
5. **Log access denials** - Monitor unauthorized access attempts

### Correct Middleware Order

```typescript
router.get(
  '/endpoint',
  requireAuth,                    // 1. Check if authenticated
  requireSameOrganization,        // 2. Verify org membership
  requireRole('admin', 'manager'), // 3. Check role
  controller
);
```

---

## 📊 Role Comparison Table

| Capability | Admin | Manager | Coach | Entrepreneur |
|-----------|-------|---------|-------|--------------|
| Create Sessions | ✓ | ✓ | ✓ | ✗ |
| Update Sessions | ✓ | ✓ | ✓ | ✗ |
| Delete Sessions | ✓ | ✓ | ✗ | ✗ |
| Create Goals | ✓ | ✓ | ✓ | ✗ |
| Update Goals | ✓ | ✓ | ✓ | ✓ |
| Delete Goals | ✓ | ✓ | ✗ | ✗ |
| Create Payments | ✓ | ✓ | ✗ | ✗ |
| View Dashboard | ✓ | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ |
| View Users | ✓ | ✓ | ✓ | ✗ |

---

## 🔄 Permission Types

```typescript
type Permission =
  | 'read:sessions'      // Can view sessions
  | 'create:session'     // Can create new sessions
  | 'update:session'     // Can modify sessions
  | 'delete:session'     // Can remove sessions
  | 'read:goals'         // Can view goals
  | 'create:goal'        // Can create goals
  | 'update:goal'        // Can modify goals
  | 'delete:goal'        // Can remove goals
  | 'read:payments'      // Can view payments
  | 'create:payment'     // Can create payment invoices
  | 'update:payment'     // Can modify payments
  | 'read:users'         // Can view user list
  | 'manage:users'       // Can create/edit/delete users
  | 'read:dashboard'     // Can view dashboard stats
  | 'read:organization'  // Can view org details
  | 'manage:organization'// Can edit org settings
```

---

## 🧪 Testing RBAC

### PowerShell Example

```powershell
# 1. Login as coach
$coach = Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body (@{ email = 'ben.coach@riverbank.example'; password = 'CoachPass1!' } | ConvertTo-Json)

$coach_token = $coach.token

# 2. Verify coach can read sessions (✓)
Invoke-RestMethod -Method Get `
  -Uri 'http://localhost:3000/api/v1/sessions' `
  -Headers @{ Authorization = "Bearer $coach_token" }

# 3. Verify coach cannot list users (✗ 403)
try {
  Invoke-RestMethod -Method Get `
    -Uri 'http://localhost:3000/api/v1/users' `
    -Headers @{ Authorization = "Bearer $coach_token" }
} catch {
  Write-Host $_.Exception.Response.StatusCode  # Should be 403
}
```

---

## 📚 Additional Resources

- See `API_DOCS.md` for complete endpoint documentation
- Check `/api-docs` (Swagger UI) for interactive testing with RBAC info
- Review `src/modules/rbac/permissions.ts` for permission definitions
- Check `src/middleware/roleCheck.ts` for middleware implementation

---

## 🔐 Admin User Creation

To create an admin user with full permissions:

```bash
npm run create:admin -- admin@company.com MyPassword123! Admin User
```

This admin user will have access to all endpoints and perform any action in the system.

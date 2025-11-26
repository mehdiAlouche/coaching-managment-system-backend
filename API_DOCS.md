# Coaching Management Backend - API Endpoints

## 🚀 Quick Access to Documentation

Once your server is running, access the interactive Swagger UI:

```
http://localhost:5000/api-docs
```

**Base URL:** All endpoints are prefixed with `/api/v1`

Example: `http://localhost:5000/api/v1/users`

---

## 📋 All Endpoints Summary

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ | Register a new user account |
| POST | `/auth/login` | ❌ | Login and receive JWT token |
| GET | `/auth/me` | ✅ | Get current user profile |

**Rate Limits:**
- Registration: 3 per hour per IP
- Login: 5 per 15 minutes per IP

---

### Users (`/api/v1/users`)

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | `/users` | ✅ | admin, manager | List all users (supports role filtering) |
| GET | `/users/profile` | ✅ | all | Get current user's profile |
| POST | `/users` | ✅ | admin, manager | Create a new user |
| GET | `/users/:userId` | ✅ | admin, manager | Get specific user details |
| PUT | `/users/:userId` | ✅ | admin, manager | Full update of user |
| PATCH | `/users/:userId` | ✅ | admin, manager | Partial update of user |
| DELETE | `/users/:userId` | ✅ | admin, manager | Soft delete user (set isActive=false) |

**Query Parameters (GET /users):**
- `role` (string) - Filter by role: `coach`, `entrepreneur`, `manager`, `admin`
- `limit` (number, default: 20, max: 100) - Results per page
- `page` (number, default: 1) - Page number (1-based)

**Example:**
```
GET /api/v1/users?role=coach&limit=10&page=1
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "coach@example.com",
      "role": "coach",
      "firstName": "John",
      "lastName": "Doe",
      "hourlyRate": 100,
      "isActive": true
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

**Note:** `/api/v1/me` is now an alias that redirects to `/api/v1/users/profile`

---

### Sessions (`/api/v1/sessions`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/sessions` | ✅ | List paginated sessions for organization |
| POST | `/sessions` | ✅ | Create a new session |
| GET | `/sessions/:sessionId` | ✅ | Get session details |
| PUT | `/sessions/:sessionId` | ✅ | Full update of session |
| PATCH | `/sessions/:sessionId` | ✅ | Partial update of session |
| DELETE | `/sessions/:sessionId` | ✅ | Delete session |
| **POST** | **`/sessions/:sessionId/rating`** | ✅ | **Submit session rating/feedback (entrepreneur)** |

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Results per page
- `page` (number, default: 1) - Page number (1-based)

**New Rating Endpoint:**
```bash
POST /api/v1/sessions/:sessionId/rating
Content-Type: application/json
Authorization: Bearer <token>

{
  "score": 5,
  "comment": "Excellent coaching session!",
  "feedback": "Very helpful insights on product-market fit. The coach provided actionable advice."
}
```

**Rating Response:**
```json
{
  "message": "Rating submitted successfully",
  "rating": {
    "score": 5,
    "comment": "Excellent coaching session!",
    "feedback": "Very helpful insights...",
    "submittedBy": "507f1f77bcf86cd799439013",
    "submittedAt": "2025-11-26T10:30:00.000Z"
  }
}
```

**Notes:**
- Only entrepreneurs can rate their own sessions (or admin/manager)
- Session must be in `completed` status to be rated
- Rating includes: `score` (1-5), `comment` (short), `feedback` (detailed)

---

### Payments & Invoices (`/api/v1/payments`)

| Method | Endpoint | Auth Required | Roles | Description |
|--------|----------|---------------|-------|-------------|
| GET | `/payments` | ✅ | admin, manager, coach | List all payments |
| POST | `/payments` | ✅ | admin, manager | Create invoice |
| POST | `/payments/generate` | ✅ | admin, manager | Auto-generate invoice from sessions |
| GET | `/payments/stats` | ✅ | admin, manager, coach | Payment statistics |
| GET | `/payments/:paymentId` | ✅ | admin, manager, coach | Get payment details |
| PATCH | `/payments/:paymentId` | ✅ | admin, manager | Update payment status |
| **GET** | **`/payments/:paymentId/invoice`** | ✅ | **admin, manager, coach** | **Download invoice as PDF** |
| **POST** | **`/payments/:paymentId/send-invoice`** | ✅ | **admin, manager** | **Email invoice to coach** |

**New Invoice Endpoints:**

**1. Download Invoice PDF:**
```bash
GET /api/v1/payments/:paymentId/invoice
Authorization: Bearer <token>
```

Returns a PDF file for download with proper headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="invoice-INV-001.pdf"`

**2. Send Invoice via Email:**
```bash
POST /api/v1/payments/:paymentId/send-invoice
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Invoice email queued for sending",
  "data": {
    "paymentId": "507f1f77bcf86cd799439030",
    "invoiceNumber": "INV-001",
    "recipient": "coach@example.com",
    "sentAt": "2025-11-26T10:30:00.000Z"
  }
}
```

**Invoice Features:**
- Server-side PDF generation using Puppeteer
- Professional HTML template with organization branding
- Line items with session details, duration, rate
- Tax calculations and totals
- Payment status badges (pending, paid, void)
- Email delivery with PDF attachment

---

### Goals (`/api/v1/goals`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/goals` | ✅ | List goals |
| POST | `/goals` | ✅ | Create goal |
| GET | `/goals/:goalId` | ✅ | Get goal details |
| PATCH | `/goals/:goalId` | ✅ | Update goal |
| DELETE | `/goals/:goalId` | ✅ | Delete goal |

---

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/dashboard/stats` | ✅ | Get organization statistics |
| GET | `/dashboard/coach` | ✅ | Coach-specific dashboard |
| GET | `/dashboard/entrepreneur` | ✅ | Entrepreneur-specific dashboard |
| GET | `/dashboard/manager` | ✅ | Manager-specific dashboard |

---

### Organizations (`/api/v1/organization`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/organization` | ✅ | Get current organization |
| PATCH | `/organization` | ✅ | Update organization settings |

---

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/notifications` | ✅ | List user notifications |
| PATCH | `/notifications/:id` | ✅ | Mark notification as read |

---

### Startups (`/api/v1/startups`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/startups` | ✅ | List startups |
| GET | `/startups/:startupId` | ✅ | Get startup details |

---

### Search (`/api/v1/search`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/search` | ✅ | Global search across entities |

---

### File Upload (`/api/v1/upload`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/upload` | ✅ | Upload file |

---

## 🔐 Authentication

All protected endpoints require the `Authorization` header with a valid JWT:

```http
Authorization: Bearer <your_jwt_token>
```

**Getting a JWT token:**

1. Register or login to get a token:
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ben.coach@riverbank.example",
  "password": "CoachPass1!"
}
```

2. Use the token in subsequent requests:
```bash
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Details:**
- Valid for: 24 hours
- Contains: userId, email, role, organizationId
- Issued by: `/auth/login` and `/auth/register`

---

## 📝 Key Changes in v1 API

### ✅ Consolidated Endpoints

**Before:**
- `GET /api/coaches` - List coaches
- `GET /api/entrepreneurs` - List entrepreneurs  
- `GET /api/me/*` - Various "me" endpoints

**After (v1):**
- `GET /api/v1/users?role=coach` - List coaches
- `GET /api/v1/users?role=entrepreneur` - List entrepreneurs
- `GET /api/v1/users/profile` - Current user profile
- `GET /api/v1/me` - Alias to `/users/profile` (convenience)

### 🆕 New Features

1. **Invoice PDF Generation** - Server-side PDF creation using Puppeteer
2. **Invoice Email Delivery** - Event-driven email endpoint with tracking
3. **Session Rating System** - Structured feedback with score, comment, and detailed feedback
4. **Role Filtering** - Filter users by any role: `?role=coach|entrepreneur|manager|admin`

### 🔒 Security Improvements

- No public email sending endpoints (email is event-driven via `/send-invoice`)
- Proper authorization checks on invoice downloads (coaches see only their own)
- Rate limiting on all authentication endpoints

---

## 📝 Request/Response Examples

### 1. Register a New User

**Request:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "newcoach@company.com",
  "password": "SecurePass123!",
  "role": "coach",
  "firstName": "John",
  "lastName": "Doe",
  "hourlyRate": 100,
  "timezone": "America/New_York"
}
```

**Success Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "newcoach@company.com",
    "role": "coach",
    "firstName": "John",
    "lastName": "Doe",
    "organizationId": "507f1f77bcf86cd799439010"
  }
}
```

---

### 2. Login

**Request:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "ben.coach@riverbank.example",
  "password": "CoachPass1!"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "email": "ben.coach@riverbank.example",
    "role": "coach",
    "firstName": "Ben",
    "lastName": "Collins"
  }
}
```

---

### 3. Get Current User Profile

**Request:**
```bash
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "email": "ben.coach@riverbank.example",
  "role": "coach",
  "firstName": "Ben",
  "lastName": "Collins",
  "organizationId": "507f1f77bcf86cd799439010",
  "hourlyRate": 120,
  "timezone": "America/New_York",
  "phone": "+1-555-0132"
}
```

---

### 4. List Sessions

**Request:**
```bash
GET /api/v1/sessions?limit=10&page=1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "organizationId": "507f1f77bcf86cd799439010",
      "coachId": "507f1f77bcf86cd799439012",
      "entrepreneurId": "507f1f77bcf86cd799439013",
      "scheduledAt": "2025-11-10T15:00:00Z",
      "endTime": "2025-11-10T16:00:00Z",
      "duration": 60,
      "status": "scheduled",
      "location": "Zoom",
      "agendaItems": [
        {
          "title": "MVP Review",
          "description": "Discuss milestones",
          "duration": 45
        }
      ]
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 10 }
}
```

---

### 5. Get Dashboard Statistics

**Request:**
```bash
GET /api/v1/dashboard/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "users": {
    "total": 12,
    "coaches": 3,
    "entrepreneurs": 9
  },
  "sessions": {
    "total": 45,
    "upcoming": 8,
    "completed": 35
  },
  "revenue": {
    "total": 15240.50
  }
}
```

---

### 6. List Users in Organization

**Request:**
```bash
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "ben.coach@riverbank.example",
      "role": "coach",
      "firstName": "Ben",
      "lastName": "Collins",
      "organizationId": "507f1f77bcf86cd799439010",
      "hourlyRate": 120,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "cara.startup@riverbank.example",
      "role": "entrepreneur",
      "firstName": "Cara",
      "lastName": "Martinez",
      "organizationId": "507f1f77bcf86cd799439010",
      "startupName": "TechVentures",
      "isActive": true,
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  ],
  "count": 2
}
```

**Error Responses:**
- `400` - Organization ID not found
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (requires admin or manager role)
- `500` - Internal server error

---

## ⚠️ Error Responses

### Validation Error (400)
```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    },
    {
      "path": "body.password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "message": "Invalid email or password"
}
```

### Rate Limited (429)
```json
{
  "message": "Too many login attempts, please try again after 15 minutes."
}
```

### Server Error (500)
```json
{
  "message": "Internal server error"
}
```

---

## 🧪 Testing with cURL / PowerShell

### PowerShell Example

```powershell
# 1. Login
$response = Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body (@{ 
    email = 'ben.coach@riverbank.example'
    password = 'CoachPass1!'
  } | ConvertTo-Json)

$token = $response.token

# 2. Use token for protected endpoint
Invoke-RestMethod -Method Get `
  -Uri http://localhost:5000/api/v1/auth/me `
  -Headers @{ Authorization = "Bearer $token" }

# 3. Get sessions
Invoke-RestMethod -Method Get `
  -Uri 'http://localhost:5000/api/v1/sessions?limit=5' `
  -Headers @{ Authorization = "Bearer $token" }
```

---

## 📦 Test Accounts (from seeder)

If you ran `npm run seed`, these test accounts are available:

| Email | Password | Role | Organization |
|-------|----------|------|--------------|
| alice.manager@riverbank.example | ManagerPass1! | manager | Riverbank Startup Hub |
| ben.coach@riverbank.example | CoachPass1! | coach | Riverbank Startup Hub |
| cara.startup@riverbank.example | Entrepreneur1! | entrepreneur | Riverbank Startup Hub |
| david.manager@northside.example | ManagerPass2! | manager | Northside Accelerator |
| emma.coach@northside.example | CoachPass2! | coach | Northside Accelerator |
| felix.startup@northside.example | Entrepreneur2! | entrepreneur | Northside Accelerator |

---

## 🛠 Global Features

- **CORS:** Enabled. Configure via `CORS_ORIGIN` env var (comma-separated list)
- **Rate Limiting:** 100 requests/min general limit, stricter for auth endpoints
- **Validation:** All POST/PATCH requests validated with Zod schemas
- **JWT Auth:** Token-based authentication with 24-hour expiry
- **Organization Scoping:** All data filtered by user's organization

---

## 🔄 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Auth required or invalid token |
| 404 | Not Found - Endpoint doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Internal error |

---

For more details, visit the **interactive Swagger UI** at `/api-docs`

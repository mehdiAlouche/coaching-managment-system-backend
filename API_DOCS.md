# Coaching Management Backend - API Endpoints

## 🚀 Quick Access to Documentation

Once your server is running, access the interactive Swagger UI:

```
http://localhost:5000/api-docs
```

Or if running on port 5000:
```
http://localhost:5000/api-docs
```

---

## 📋 All Endpoints Summary

### Authentication (`/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | ❌ | Register a new user account |
| POST | `/auth/login` | ❌ | Login and receive JWT token |
| GET | `/auth/me` | ✅ | Get current user profile |

**Rate Limits:**
- Registration: 3 per hour per IP
- Login: 5 per 15 minutes per IP

---

### Sessions (`/sessions`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/sessions?limit=5&page=1` | ✅ | List paginated sessions for organization |

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Results per page
- `page` (number, default: 1) - Page number (1-based)

**Response:**
```json
{
  "data": [ { session objects } ],
  "meta": { "total": 50, "page": 1, "limit": 20 }
}
```

---

### Dashboard (`/dashboard`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/dashboard/stats` | ✅ | Get organization statistics |

**Response:**
```json
{
  "users": { "total": 12, "coaches": 3, "entrepreneurs": 9 },
  "sessions": { "total": 45, "upcoming": 8, "completed": 35 },
  "revenue": { "total": 15240.50 }
}
```

---

### Users (`/users`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/users` | ✅ | List active users in organization (admin/manager only) |

**Access Control:**
- Only `admin` and `manager` roles can access this endpoint
- Returns only users from the authenticated user's organization
- Only active users (`isActive: true`) are returned

**Response:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "role": "coach",
      "firstName": "John",
      "lastName": "Doe",
      "organizationId": "507f1f77bcf86cd799439012",
      "hourlyRate": 75,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Note:** The `password` field is excluded from the response for security.

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
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Details:**
- Valid for: 24 hours
- Contains: userId, email, role, organizationId
- Issued by: `/auth/login` and `/auth/register`

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

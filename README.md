## Coaching Management System — Backend (Node.js + TypeScript)

A lightweight Express + TypeScript backend for a multi-tenant coaching management system. It uses MongoDB (via Mongoose) for persistence, JWT for auth, and includes middleware for organization scoping and role-based access control.

### Tech stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Web framework**: Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (via `jsonwebtoken`)

### Project structure
```
src/
  _shared/
    enums/
      httpStatus.ts
      userRoles.ts
    base/
      baseService.ts
  config/
    db.ts           # Mongo connection helper
    env.ts          # dotenv loader (if used directly)
  middleware/
    auth.ts         # JWT auth guard
    organizationScope.ts  # multi-tenant org scoping
    roleCheck.ts     # role-based access
  modules/
    auth/
      controller/
        authController.ts
      service/
        authService.ts
    user/
      model/
        user.model.ts
    organization/
      model/
        organization.model.ts
    goal/
      model/
        goal.model.ts
    payment/
      model/
        payment.model.ts
    session/
      model/
        session.model.ts
  routes/
    auth.ts
    user.ts
    index.ts        # mounts module routes under /api
  main.ts           # app entry
```

### Requirements
- Node.js 18+
- npm 9+ (comes with Node)
- MongoDB 6+ (local or hosted)

### Quick start
1) Install dependencies
```bash
npm install
```

2) Configure environment
- Copy `.env` from the provided example and fill values:
```bash
cp env.example .env
```
- Required variables:
  - `PORT` — server port (default 5000)
  - `MONGO_URI` — MongoDB connection string (e.g., `mongodb://localhost:27017/cms`)
  - `JWT_SECRET` — secret for signing JWT tokens

3) Run in development (with hot reload)
```bash
npm run dev
```

4) Build and run in production
```bash
npm run build
npm start
```

You should see logs similar to:
```
MongoDB connected
Server listening on port 5000
```

### NPM scripts
- `npm run dev` — start in dev mode with ts-node-dev
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled app from `dist/`
- `npm run typecheck` — type-check without emitting

### Environment
Example `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cms
JWT_SECRET=dev-secret
```

### API overview
Base URL prefix: `/api/v1`

- `GET /api/v1/` — health/root
- `POST /api/v1/auth/register` — register user (stub)
- `POST /api/v1/auth/login` — login and get JWT (stub)
- `GET /api/v1/users` — list users in same organization (protected; stub)

Note: Several handlers are scaffolds/stubs intended to be implemented (see `modules/auth/*`, `routes/auth.ts`, etc.).

#### Auth
- JWT is expected in the `Authorization` header as `Bearer <token>`.
- Middleware `requireAuth` validates the token and attaches `req.user`.

Example request:
```bash
curl -X GET http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer <your-jwt>"
```

#### Multi-tenant organization scoping
- `requireSameOrganization` enforces that the authenticated user's `organizationId` matches the target organization.
- It reads org id from one of: `req.params.organizationId`, `req.body.organizationId`, or header `x-organization-id`.

#### Role-based access control
- `requireRole(...roles)` ensures the authenticated user has one of the required roles.
- Roles enum: `manager`, `coach`, `entrepreneur` (see `_shared/enums/userRoles.ts`).

### Data models (Mongoose)
- `User` — `email`, `password`, `role`, `organizationId`
- `Organization` — `name`
- `Goal` — `title`, `completed`, `organizationId`
- `Payment` — `amount`, `currency`, `organizationId`
- `Session` — `title`, `start`, `end`, `organizationId`

### Local testing
A REST client file is available under `src/test-rest/user.rest` (compatible with VS Code REST Client or similar tools).

### Implementation notes & next steps
- Replace auth stubs: implement registration (hash with `bcryptjs`) and login (verify password, issue JWT with `jsonwebtoken`).
- Flesh out user listing with real DB queries and add pagination/filters.
- Add validation (e.g., `zod` or `express-validator`).
- Add error handling middleware and structured logging.
- Add tests (unit/integration) as the surface grows.

### License
MIT

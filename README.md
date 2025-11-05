# Coaching Management Backend (TypeScript + Express)

This repository is a starting scaffold for the coaching management system backend using TypeScript, Express and MongoDB (Mongoose).

Quick start

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies: npm install
3. Start in dev mode: npm run dev

Project layout (key folders in `src/`):

- `config/` - env and DB connection
- `middleware/` - auth, role checks, organizationScope (multi-tenant enforcement)
- `_shared/` - enums and base classes
- `modules/` - domain modules (auth, user, organization, session, goal, payment)
- `routes/` - central router aggregation

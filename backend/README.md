# LabTrack backend

The backend is an Express API backed by MongoDB through Mongoose. Authentication uses JWT access tokens and bcryptjs password hashing.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Set `MONGODB_URI` to the MongoDB database used by the project. Set `JWT_SECRET` to a long, random, private value. `JWT_SECRET` signs and verifies every authentication token; never commit it or use the example value in a deployed environment.

Optional `JWT_EXPIRES_IN` controls token lifetime and defaults to `1d`.

## Run

```bash
npm start
```

The API starts on port `5000` by default. The health check is available at `GET /api/health`.

## Authentication endpoints

- `POST /api/auth/register` — create a student or lecturer account.
- `POST /api/auth/login` — return a JWT and safe user details.
- `GET /api/auth/me` — return the authenticated user. Send `Authorization: Bearer <token>`.

Authentication middleware is in `src/middleware/auth.js`. Use `requireRole('student')` or `requireRole('lecturer')` on future protected routes.

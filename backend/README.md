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

The API starts on port `5001` by default. The health check is available at `GET /api/health`.

## Authentication endpoints

- `POST /api/auth/register` — create a student or lecturer account.
- `POST /api/auth/login` — return a JWT and safe user details.
- `GET /api/auth/me` — return the authenticated user. Send `Authorization: Bearer <token>`.

Authentication middleware is in `src/middleware/auth.js`. Use `requireRole('student')` or `requireRole('lecturer')` on future protected routes.

## Lab session endpoints

All lab session endpoints require a valid bearer token. Students and lecturers can read sessions. Only lecturers can create, update, or delete sessions, and a lecturer can modify only sessions they created.

- `GET /api/lab-sessions`
- `GET /api/lab-sessions/:id`
- `POST /api/lab-sessions`
- `PATCH /api/lab-sessions/:id`
- `DELETE /api/lab-sessions/:id`

## Assignment endpoints

All assignment endpoints require a valid bearer token.

| Method | Path | Access | Behaviour |
| --- | --- | --- | --- |
| `GET` | `/api/assignments` | Student, Lecturer | Students receive only `Published` assignments. Lecturers receive only the assignments they created. Sorted by deadline. |
| `GET` | `/api/assignments/:id` | Student, Lecturer | Students can read only `Published` assignments. Lecturers can read only their own. |
| `POST` | `/api/assignments` | Lecturer | Creates an assignment owned by the authenticated lecturer. |
| `PATCH` | `/api/assignments/:id` | Owning lecturer | Partial update. The `lecturer` field cannot be changed. |
| `DELETE` | `/api/assignments/:id` | Owning lecturer | Deletes the assignment. |

### Assignment model (`src/models/Assignment.js`)

`title` (≤ 150 characters), `module` (≤ 100), `description` (≤ 5000), `submissionRequirements` (optional, ≤ 2000), `deadline` (Date, years 2000–2100), `totalMarks` (whole number 1–1000), `allowedFileTypes` (`PDF`, `DOCX`, `JPG`, `PNG`, `ZIP`; at least one), `requiredFiles` (1–20 names), `maxFileSizeMB` (whole number 1–100), `lateSubmissionAllowed`, `status` (`Draft`, `Published`, `Closed`), `lecturer` (reference to `User`, always set from the authenticated user), plus `createdAt` and `updatedAt`.

Limits are defined once in the model and enforced both by the schema and by request validation. Indexes: `lecturer + status + deadline` for list queries, and a unique, case-insensitive `lecturer + module + title` index so a lecturer cannot create duplicate assignments. Mongoose builds these indexes when the server connects; no existing documents are modified.

Relationships: each assignment references its owning lecturer. There is no Submission model yet, so no assignment–submission relationship exists. When one is added it should reference `Assignment` and `User` (student), and `deleteAssignment` in `src/controllers/assignments.js` should refuse to delete (or cascade) assignments that already have submissions.

### Business rules and status codes

- `400` validation failure, malformed JSON, or an invalid assignment ID. Validation responses include an `errors` array.
- `401` missing, invalid, expired, unsigned, or orphaned token. `403` a student attempting a lecturer-only action.
- `404` the assignment does not exist, is not visible to the caller (a Draft requested by a student), or is owned by another lecturer.
- `409` a Published or Closed assignment cannot be moved back to `Draft`, because students may already have seen it; or a lecturer already has an assignment with the same title in the same module.
- `413` request body over 100 KB. `429` too many failed sign-ins or registrations.
- `503` MongoDB is unreachable. `500` unexpected errors. Both return a generic message; details are logged on the server only.

## Security

- JWTs are verified with the HS256 algorithm only (unsigned and other-algorithm tokens are rejected). The token's subject must be a valid ID of an existing user, and the user's **role is read from the database**, never from the token.
- Registration and login accept only text values (this blocks operator-injection payloads such as `{"$ne": null}`), limit name and email length, and cap registration passwords at bcrypt's 72-byte limit. Passwords are hashed with bcrypt and never returned.
- Failed sign-ins are limited to 10 per 15 minutes per IP address and registrations to 30 per hour. The counters are in memory, so they reset when the server restarts and are per-process.
- Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Cache-Control: no-store`; the `X-Powered-By` header is removed.
- CORS allows only the origins in `CORS_ORIGIN` (default `http://localhost:5173,http://127.0.0.1:5173`). Set it in `.env` if the frontend runs on another origin.
- Unknown `/api/*` routes return a JSON 404, and all errors go through `src/middleware/errorHandler.js`, which never returns stack traces, connection strings, or environment values.
- The server warns at startup if `JWT_SECRET` is shorter than 32 characters or still the example value.
- Known limitation: anyone can register with the `lecturer` role. Restrict this (for example with an invite code or admin approval) before using the app outside a coursework demo.

## Tests

```bash
npm test
```

Without a test database, only the database-free unit tests run (assignment validation, ID checks, rate limiter, error handler, security headers). The database-backed API tests (authentication, authorization, assignment CRUD, duplicate titles, database outage) run when `MONGODB_TEST_URI` is set. They create and remove their own users and assignments, never read `.env`, never use the real `JWT_SECRET`, and refuse to run unless the database name contains `test` and differs from `MONGODB_URI`.

```bash
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/labtrack_assignment_test npm test
```

Shared test setup lives in `testing/context.js`; the tests are in `test/`.

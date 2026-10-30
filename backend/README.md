# LabTrack backend

The backend is an Express API backed by MongoDB through Mongoose. Authentication uses JWT access tokens and bcryptjs password hashing. Node.js 22 or newer is required.

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

Relationships: each assignment references its owning lecturer. Submissions reference both an assignment and a student. Assignment deletion returns `409` if submissions exist or an upload is in progress; close the assignment to stop new uploads while preserving records. An atomic upload reservation prevents deletion races on standalone MongoDB as well as replica sets.

## Persistent student submissions

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/submissions/assignments/:assignmentId` | Student; Published assignment only |
| `GET` | `/api/submissions` | Student's own submissions, or submissions for the lecturer's own assignments |
| `GET` | `/api/submissions?assignment=:id` | Same ownership rules, filtered by assignment |
| `GET` | `/api/submissions/:id` | Submitting student or owning lecturer |
| `GET` | `/api/submissions/:id/files/:fileId` | Protected attachment download; same ownership rules |
| `PATCH` | `/api/submissions/:id/review` | Owning lecturer only |

Upload `multipart/form-data` with repeated `files` parts and exactly one `attachments` field containing a JSON array of labels in file order, for example `["Report", "Source files"]`. Labels match the assignment's `requiredFiles` case-insensitively after trimming; use an empty string for a supporting attachment. These labels describe attachment roles; they do not require every allowed format to be uploaded and do not verify the academic content of a file.

The server allows at most 20 files per attempt and applies the assignment's maximum size **per file** while streaming to disk. It checks binary file signatures against extensions for PDF, DOCX, JPG/JPEG, PNG and ZIP, then checks the assignment's allowed formats. ZIP/DOCX containers must have a valid directory, safe entry names, no encryption, at most 10,000 entries and at most 500 MB declared expanded size. DOCX must contain its content-types and Word document entries. Archives are never extracted or executed. This is format checking, not malware scanning or full document parsing.

Format, size, malformed upload and prohibited-late failures are rejected and their temporary files are removed. Allowed-late submissions and submissions missing required attachment labels are saved with explicit failed checks so the lecturer can review the work. The deadline is measured by the server when receiving and validating the complete upload, and is rechecked after upload. Each successful attempt is a separate immutable history record; resubmission does not replace prior files or marks.

`Submission` stores file metadata and generated relative storage paths, the timestamp, On time/Late status, a snapshot of the assignment requirements and maximum marks, separate compliance results, review status, marks, feedback and reviewer. Reviews accept `{ "reviewStatus": "Draft" | "Graded", "marks": number | null, "feedback": string }`. A draft may be unmarked; publishing requires marks from zero through the saved maximum. Students see marks and feedback only after publication. Automatic checks never calculate or change lecturer marks.

Files persist under `backend/storage/submissions` by default, outside the frontend and all static routes. Set `SUBMISSION_STORAGE_DIR` to an absolute private directory to use another disk. Upload directories and filenames use server-generated UUIDs; original filenames are metadata only. API JSON excludes storage paths, and downloads require a bearer token and an ownership check on every request. Keep both MongoDB and this directory across server restarts and back them up together; local files are not stored inside MongoDB. Do not expose the storage directory through a static web server.

Tests use a fresh private temporary upload directory per process. Rejected and interrupted uploads are cleaned up; successful test fixtures are deleted in teardown. A hard process crash can leave an unreferenced upload directory or a conservative assignment reservation; automatic crash recovery and storage retention management are not implemented. Such reservations deliberately block deletion rather than risk orphaning a submission.

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

Without a test database, only the database-free unit tests run (assignment validation, ID checks, rate limiter, error handler, security headers, database safeguards). The database-backed API tests (authentication, authorization, assignment CRUD, duplicate titles, database outage and persistence after reconnection) run when `MONGODB_TEST_URI` is set. They create and remove only their own users and assignments; they never drop a database or clear a collection. Test connections use only `MONGODB_TEST_URI` and a fixed test JWT secret. The safety guard reads `backend/.env` only to compare its `MONGODB_URI` database name, without loading environment values or using those credentials.

The database name must end in `_test` and must differ from both the environment and `.env` development database names, even when their hosts, credentials, or options differ. Database-name query overrides are rejected. Cleanup rechecks the connected database before deleting test fixtures. Invalid or unreachable test configurations fail rather than falling back to the development database.

```bash
MONGODB_TEST_URI=mongodb://127.0.0.1:27028/labtrack_portal_test npm test
```

For complete local isolation, start a separate MongoDB process on port `27028` with a fresh temporary storage directory first:

```bash
test_db_dir=$(mktemp -d /private/tmp/labtrack-mongo-test.XXXXXX)
mongod --dbpath "$test_db_dir" --bind_ip 127.0.0.1 --port 27028
```

Run the test command in a second terminal, then stop that temporary MongoDB process with Ctrl-C. The URI is scoped to the test command; no `.env` edit or credentials are needed. Do not point this process at your existing MongoDB storage directory.

Shared test setup lives in `testing/context.js`; the tests are in `test/`.

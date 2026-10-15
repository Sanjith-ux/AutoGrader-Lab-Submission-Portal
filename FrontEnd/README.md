# LabTrack frontend

React and Vite frontend for the AutoGrader & Lab Submission Portal. It talks to the Express API at `VITE_API_BASE_URL` (default `http://localhost:5001/api`).

## Run locally

```bash
cd FrontEnd
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Assignment pages

- `src/api/assignments.js` — API calls and the mapping between the UI form fields and the API model (`subject` ↔ `module`, `maxFileSize` ↔ `maxFileSizeMB`, `allowLateSubmissions` ↔ `lateSubmissionAllowed`).
- `src/pages/LecturerAssignmentsPage.jsx` — list, filter, search, sort, view, publish, delete.
- `src/pages/LecturerAssignmentFormPage.jsx` — create and edit with client-side validation.
- `src/pages/AssignmentsPage.jsx` and `AssignmentDetailsPage.jsx` — student read-only views with loading, error, and empty states.

Student submissions are still local placeholders; the Submission API is not built yet.

# LabTrack — AutoGrader & Lab Submission Portal

A MERN-style web application. Students view lab schedules and published assignments; lecturers manage lab sessions and assignments.

- `backend/` — Node.js, Express, Mongoose, JWT authentication (port `5001`). See [backend/README.md](backend/README.md) for the API.
- `FrontEnd/` — React and Vite single-page app (port `5173`). See [FrontEnd/README.md](FrontEnd/README.md).

## Run locally

Requires Node.js and a running MongoDB instance.

```bash
# Terminal 1 — API
cd backend
npm install
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm run dev            # or: npm start

# Terminal 2 — web app
cd FrontEnd
npm install
npm run dev
```

Open http://localhost:5173, register a student and a lecturer account, and sign in.

## Assignment management (CRUD)

Lecturer: **Assignments** in the sidebar.

- **Create** — *Create Assignment*, then *Save as Draft* or *Publish Assignment*.
- **Read** — the list loads from MongoDB with status filters, search, and sorting. *View* opens the details panel. Students see only Published assignments under *Assignments*.
- **Update** — *Edit*, change values, then save. Drafts can be saved or published; Published and Closed assignments keep their status and cannot return to Draft.
- **Delete** — *Delete* asks for confirmation. Only the owning lecturer can delete.

## Submissions and feedback

Students upload files from **Assignments → View assignment** and see persisted attempts, automatic checks and published feedback under **My Submissions**. **Marks & Feedback** shows each attempt separately so a newer pending attempt cannot hide an earlier published grade. Its average counts the latest graded attempt per assignment and uses the saved maximum marks. Lecturers must use **Publish Review** to make marks visible; **Save Draft** keeps that review private.

Lecturers can download protected reports and save draft or published marks from **Student Submissions** or **Marks & Feedback**. Both pages use the same MongoDB submission records. Draft marks and feedback remain private to lecturers. Feedback uses the persisted comments field; there are no separate strengths or improvements fields in the API.

Assignments with submissions or uploads in progress cannot be deleted. Close them instead. File bytes live in private backend storage, so keep that directory together with MongoDB across restarts. See [backend/README.md](backend/README.md) for upload limits and configuration.

## Checks

```bash
cd backend && npm test
cd FrontEnd && npm run lint && npm run build
```

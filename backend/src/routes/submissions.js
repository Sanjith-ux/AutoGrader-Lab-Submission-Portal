import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { downloadSubmissionFile, getSubmission, listSubmissions, reviewSubmission, uploadSubmission } from '../controllers/submissions.js'

const router = express.Router()
router.use(authenticateToken, requireRole('student', 'lecturer'))
router.get('/', listSubmissions)
router.post('/assignments/:assignmentId', requireRole('student'), uploadSubmission)
router.get('/:id', getSubmission)
router.get('/:id/files/:fileId', downloadSubmissionFile)
router.patch('/:id/review', requireRole('lecturer'), reviewSubmission)
export default router

import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { downloadSubmissionFile, getSubmission, listSubmissions, reviewSubmission, uploadSubmission, withdrawSubmission, restoreSubmission } from '../controllers/submissions.js'

const router = express.Router()
router.use(authenticateToken, requireRole('student', 'lecturer'))
router.get('/', listSubmissions)
router.post('/assignments/:assignmentId', requireRole('student'), uploadSubmission)
router.get('/:id', getSubmission)
router.get('/:id/files/:fileId', downloadSubmissionFile)
router.patch('/:id/review', requireRole('lecturer'), reviewSubmission)
router.post('/:id/withdraw', requireRole('lecturer'), withdrawSubmission)
router.post('/:id/restore', requireRole('lecturer'), restoreSubmission)
export default router

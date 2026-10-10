import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { createLabSession, deleteLabSession, getLabSession, listLabSessions, updateLabSession } from '../controllers/labSessions.js'

const router = express.Router()

router.use(authenticateToken)
router.get('/', listLabSessions)
router.get('/:id', getLabSession)
router.post('/', requireRole('lecturer'), createLabSession)
router.patch('/:id', requireRole('lecturer'), updateLabSession)
router.delete('/:id', requireRole('lecturer'), deleteLabSession)

export default router

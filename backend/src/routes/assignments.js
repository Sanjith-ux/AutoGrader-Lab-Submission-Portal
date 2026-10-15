import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { createAssignment, deleteAssignment, getAssignment, listAssignments, updateAssignment } from '../controllers/assignments.js'

const router = express.Router()

router.use(authenticateToken)
router.get('/', listAssignments)
router.get('/:id', getAssignment)
router.post('/', requireRole('lecturer'), createAssignment)
router.patch('/:id', requireRole('lecturer'), updateAssignment)
router.delete('/:id', requireRole('lecturer'), deleteAssignment)

export default router

import path from 'node:path'
import Assignment from '../models/Assignment.js'
import Submission from '../models/Submission.js'
import { isValidObjectId } from '../utils/objectId.js'
import { checkCompliance, inspectFile, receiveFiles, removeUploadDirectory, submissionError, uploadRoot } from '../services/submissionFiles.js'

function requireId(id) {
  if (!isValidObjectId(id)) throw submissionError(400, 'Invalid identifier.')
}

function studentWithdrawal(submission, now = new Date()) {
  const deadline = submission.assignment?.deadline
  let reason = ''
  if (submission.withdrawnAt) reason = 'This submission is already withdrawn. Only the owning lecturer can restore it.'
  else if (submission.reviewStatus !== 'Awaiting Review' || submission.marks != null || submission.reviewedAt != null) reason = 'Lecturer review has started or a grade has been published. Student withdrawal is no longer available.'
  else if (!deadline || !(now < new Date(deadline))) reason = 'The assignment deadline has passed. Student withdrawal is no longer available.'
  return { allowed: !reason, reason, deadline }
}

function publicSubmission(submission, role) {
  const value = submission.toObject()
  value.files = value.files.map(({ storagePath: _storagePath, ...file }) => file)
  if (role === 'student') value.studentWithdrawal = studentWithdrawal(value)
  if (role === 'student' && value.reviewStatus !== 'Graded') {
    value.marks = null
    value.feedback = ''
  }
  return value
}

function populate(query) {
  return query.populate('student', 'name email').populate('assignment', 'title module deadline status totalMarks').populate('reviewedBy', 'name').populate('withdrawnBy', 'name').populate('withdrawalHistory.actor', 'name')
}

async function accessFilter(user) {
  if (user.role === 'student') return { student: user._id }
  return { assignment: { $in: await Assignment.find({ lecturer: user._id }).distinct('_id') } }
}

async function ownedSubmission(req) {
  requireId(req.params.id)
  const submission = await populate(Submission.findOne({ _id: req.params.id, ...await accessFilter(req.user) }))
  if (!submission) throw submissionError(404, 'Submission not found.')
  return submission
}

export async function uploadSubmission(req, res, next) {
  let reserved
  let saved = false
  try {
    requireId(req.params.assignmentId)
    // This atomic reservation and conditional assignment deletion serialize uploads
    // against deletes without requiring a replica set or MongoDB transactions.
    reserved = await Assignment.findOneAndUpdate({ _id: req.params.assignmentId, status: 'Published' }, { $inc: { submissionCount: 1 } }, { new: true })
    if (!reserved) throw submissionError(404, 'Published assignment not found.')
    if (new Date() > reserved.deadline && !reserved.lateSubmissionAllowed) throw submissionError(409, 'The deadline has passed and late submissions are not allowed.')
    await receiveFiles(req, res, reserved.maxFileSizeMB)
    let attachments
    try { attachments = JSON.parse(req.body.attachments || '[]') } catch { throw submissionError(400, 'Attachment labels must be a JSON array.') }
    if (!Array.isArray(attachments) || attachments.length !== req.files.length || attachments.some((label) => typeof label !== 'string' || label.length > 200)) {
      throw submissionError(400, 'Provide one attachment label per uploaded file (up to 200 characters).')
    }
    const files = []
    for (const [index, file] of req.files.entries()) files.push({ ...await inspectFile(file), attachment: attachments[index].trim() })
    // Recheck current requirements at receipt time; a long upload cannot bypass a deadline.
    const assignment = await Assignment.findById(reserved._id)
    if (assignment.status !== 'Published') throw submissionError(409, 'This assignment is no longer accepting submissions.')
    const submittedAt = new Date()
    const compliance = checkCompliance(assignment, files, submittedAt)
    if (!compliance.checks.fileType.passed || !compliance.checks.fileSize.passed) throw submissionError(400, 'Files do not meet the assignment format or size limits.', compliance)
    if (!compliance.checks.deadline.passed && !assignment.lateSubmissionAllowed) throw submissionError(409, 'The deadline has passed and late submissions are not allowed.', compliance)
    const requirements = Object.fromEntries(['deadline', 'allowedFileTypes', 'maxFileSizeMB', 'requiredFiles', 'lateSubmissionAllowed', 'totalMarks'].map((key) => [key, assignment[key]]))
    const submission = await Submission.create({ student: req.user._id, assignment: assignment._id, files, submittedAt, timing: compliance.checks.deadline.passed ? 'On time' : 'Late', requirements, compliance })
    saved = true
    res.status(201).json({ submission: publicSubmission(await populate(Submission.findById(submission._id)), req.user.role) })
  } catch (error) {
    if (!saved) {
      try {
        await removeUploadDirectory(req.uploadDirectory)
        if (reserved) await Assignment.updateOne({ _id: reserved._id, submissionCount: { $gt: 0 } }, { $inc: { submissionCount: -1 } })
      } catch (cleanupError) { console.error('Failed to clean up an unsuccessful submission:', cleanupError.name) }
    }
    next(error)
  }
}

export async function listSubmissions(req, res, next) {
  try {
    const filter = await accessFilter(req.user)
    const view = req.query.view || (req.user.role === 'lecturer' ? 'active' : 'all')
    if (!['active', 'withdrawn', 'all'].includes(view)) throw submissionError(400, 'Submission view must be active, withdrawn, or all.')
    if (view === 'active') filter.withdrawnAt = null
    if (view === 'withdrawn') filter.withdrawnAt = { $ne: null }
    if (req.query.assignment) {
      requireId(req.query.assignment)
      // Keep the ownership filter as well as the caller-supplied assignment filter.
      filter.$and = [{ assignment: req.query.assignment }]
    }
    const submissions = await populate(Submission.find(filter).sort({ submittedAt: -1 }))
    res.json({ submissions: submissions.map((submission) => publicSubmission(submission, req.user.role)) })
  } catch (error) { next(error) }
}

export async function getSubmission(req, res, next) {
  try { res.json({ submission: publicSubmission(await ownedSubmission(req), req.user.role) }) } catch (error) { next(error) }
}

export async function reviewSubmission(req, res, next) {
  try {
    const submission = await ownedSubmission(req)
    if (submission.withdrawnAt) throw submissionError(409, 'Withdrawn submissions cannot be graded. Restore the submission first.')
    const { marks, feedback, reviewStatus } = req.body || {}
    const errors = []
    if (!['Draft', 'Graded'].includes(reviewStatus)) errors.push('Review status must be Draft or Graded.')
    if (marks !== null && (typeof marks !== 'number' || !Number.isFinite(marks) || marks < 0 || marks > submission.requirements.totalMarks)) errors.push(`Marks must be between 0 and ${submission.requirements.totalMarks}, or null for an unmarked draft.`)
    if (reviewStatus === 'Graded' && marks === null) errors.push('Provide marks before publishing feedback.')
    if (typeof feedback !== 'string' || feedback.length > 5000) errors.push('Feedback must be text of at most 5000 characters.')
    if (errors.length) throw Object.assign(submissionError(400, 'Validation failed.'), { details: errors })
    const updated = await populate(Submission.findOneAndUpdate({ _id: submission._id, withdrawnAt: null }, { $set: { marks, feedback: feedback.trim(), reviewStatus, reviewedBy: req.user._id, reviewedAt: new Date() } }, { new: true, runValidators: true }))
    if (!updated) throw submissionError(409, 'Withdrawn submissions cannot be graded. Restore the submission first.')
    res.json({ submission: publicSubmission(updated, req.user.role) })
  } catch (error) { next(error) }
}

async function changeWithdrawal(req, res, next, withdraw) {
  try {
    const submission = await ownedSubmission(req)
    const reason = req.body?.reason
    if (typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 1000) throw submissionError(400, 'Provide a reason of 5 to 1000 characters.')
    const at = new Date()
    const student = req.user.role === 'student'
    if (student) {
      if (!withdraw) throw submissionError(403, 'Only the owning lecturer can restore submissions.')
      const eligibility = studentWithdrawal(submission, at)
      if (!eligibility.allowed) throw submissionError(409, eligibility.reason)
    }
    const updated = await populate(Submission.findOneAndUpdate({
      _id: submission._id,
      withdrawnAt: withdraw ? null : { $ne: null },
      // Recheck review state and deadline at the atomic write, so concurrent
      // grading or crossing the deadline cannot bypass student restrictions.
      ...(student ? { student: req.user._id, reviewStatus: 'Awaiting Review', marks: null, reviewedAt: null, $expr: { $lt: ['$$NOW', submission.assignment.deadline] } } : {}),
    }, {
      $set: { withdrawnAt: withdraw ? at : null, withdrawnBy: withdraw ? req.user._id : null, withdrawalReason: withdraw ? reason.trim() : '' },
      $push: { withdrawalHistory: { action: withdraw ? 'Withdrawn' : 'Restored', reason: reason.trim(), actor: req.user._id, at } },
    }, { new: true, runValidators: true }))
    if (!updated) throw submissionError(409, student ? 'Withdrawal is no longer available: the deadline, review or withdrawal state changed. Refresh your submissions.' : withdraw ? 'This submission is already withdrawn.' : 'This submission is already active.')
    res.json({ submission: publicSubmission(updated, req.user.role) })
  } catch (error) { next(error) }
}

export const withdrawSubmission = (req, res, next) => changeWithdrawal(req, res, next, true)
export const restoreSubmission = (req, res, next) => changeWithdrawal(req, res, next, false)

export async function downloadSubmissionFile(req, res, next) {
  try {
    const submission = await ownedSubmission(req)
    requireId(req.params.fileId)
    const file = submission.files.id(req.params.fileId)
    if (!file) throw submissionError(404, 'File not found.')
    const location = path.resolve(uploadRoot, file.storagePath)
    if (!location.startsWith(`${uploadRoot}${path.sep}`)) throw submissionError(404, 'File not found.')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    res.download(location, file.originalName, (error) => {
      if (error) next(error.code === 'ENOENT' ? submissionError(404, 'The stored file is unavailable.') : error)
    })
  } catch (error) { next(error) }
}

import Assignment, { allowedFileTypeValues, assignmentLimits, assignmentStatuses } from '../models/Assignment.js'
import { isValidObjectId } from '../utils/objectId.js'

const fields = ['title', 'module', 'description', 'submissionRequirements', 'deadline', 'totalMarks', 'allowedFileTypes', 'requiredFiles', 'maxFileSizeMB', 'lateSubmissionAllowed', 'status']
const allowedFileTypes = new Set(allowedFileTypeValues)
const earliestDeadlineYear = 2000
const latestDeadlineYear = 2100

function toNumber(value) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return Number.NaN
}

function validateText(data, errors, field, label, maxLength, { required = true } = {}) {
  if (typeof data[field] !== 'string') {
    errors.push(required ? `${label} is required.` : `${label} must be text.`)
    return
  }
  data[field] = data[field].trim()
  if (required && !data[field]) errors.push(`${label} is required.`)
  else if (data[field].length > maxLength) errors.push(`${label} must be ${maxLength} characters or fewer.`)
}

function validateWholeNumber(data, errors, field, label, max, unit = '') {
  const value = toNumber(data[field])
  if (!Number.isInteger(value) || value < 1) errors.push(`${label} must be a whole number greater than zero.`)
  else if (value > max) errors.push(`${label} must be ${max}${unit} or less.`)
  else data[field] = value
}

function validateDeadline(data, errors) {
  const raw = data.deadline
  const deadline = raw instanceof Date ? raw : typeof raw === 'string' && raw.trim() ? new Date(raw) : null
  if (!deadline || Number.isNaN(deadline.getTime())) errors.push('Deadline must be a valid date.')
  else if (deadline.getUTCFullYear() < earliestDeadlineYear || deadline.getUTCFullYear() > latestDeadlineYear) errors.push(`Deadline must be between the years ${earliestDeadlineYear} and ${latestDeadlineYear}.`)
  else data.deadline = deadline
}

function validateStringList(data, errors, field, label, { maxItems, maxItemLength, normalize = (item) => item }) {
  const list = data[field]
  if (!Array.isArray(list) || list.length === 0) {
    errors.push(`${label} must include at least one value.`)
    return
  }
  if (list.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${label} must only contain non-empty text values.`)
    return
  }
  const cleaned = [...new Set(list.map((item) => normalize(item.trim())))]
  if (cleaned.length > maxItems) errors.push(`${label} can include at most ${maxItems} values.`)
  else if (cleaned.some((item) => item.length > maxItemLength)) errors.push(`${label} values must be ${maxItemLength} characters or fewer.`)
  else data[field] = cleaned
}

function validationError(message, errors = []) {
  const error = new Error(message)
  error.status = 400
  error.details = errors
  return error
}

export function validateAssignmentPayload(payload = {}, partial = false) {
  payload = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  const errors = []
  const data = {}
  fields.forEach((field) => {
    if (payload[field] !== undefined) data[field] = payload[field]
  })

  const shouldCheck = (field) => !partial || payload[field] !== undefined

  if (shouldCheck('title')) validateText(data, errors, 'title', 'Assignment title', assignmentLimits.title)
  if (shouldCheck('module')) validateText(data, errors, 'module', 'Module', assignmentLimits.module)
  if (shouldCheck('description')) validateText(data, errors, 'description', 'Description', assignmentLimits.description)
  if (data.submissionRequirements !== undefined) validateText(data, errors, 'submissionRequirements', 'Submission requirements', assignmentLimits.submissionRequirements, { required: false })
  if (shouldCheck('deadline')) validateDeadline(data, errors)
  if (shouldCheck('totalMarks')) validateWholeNumber(data, errors, 'totalMarks', 'Total marks', assignmentLimits.maxMarks)
  if (shouldCheck('allowedFileTypes')) {
    validateStringList(data, errors, 'allowedFileTypes', 'Allowed file types', { maxItems: allowedFileTypes.size, maxItemLength: 10, normalize: (item) => item.toUpperCase() })
    if (Array.isArray(data.allowedFileTypes) && data.allowedFileTypes.some((item) => !allowedFileTypes.has(item))) errors.push('Allowed file types contain an unsupported file type.')
  }
  if (shouldCheck('requiredFiles')) validateStringList(data, errors, 'requiredFiles', 'Required files', { maxItems: assignmentLimits.requiredFiles, maxItemLength: assignmentLimits.requiredFileName })
  if (shouldCheck('maxFileSizeMB')) validateWholeNumber(data, errors, 'maxFileSizeMB', 'Maximum file size', assignmentLimits.maxFileSizeMB, ' MB')
  if (data.lateSubmissionAllowed !== undefined && typeof data.lateSubmissionAllowed !== 'boolean') errors.push('lateSubmissionAllowed must be true or false.')
  if (data.status !== undefined && !assignmentStatuses.includes(data.status)) errors.push('Status must be Draft, Published, or Closed.')
  if (errors.length) throw validationError('Validation failed.', errors)
  return data
}

function invalidIdResponse(res) {
  res.status(400).json({ message: 'Invalid assignment ID.' })
}

function populated(query) {
  return query.populate('lecturer', 'name')
}

function handleWriteError(error, res, next) {
  if (error.code === 11000) {
    res.status(409).json({ message: 'You already have an assignment with this title in this module.' })
    return
  }
  next(error)
}

export async function listAssignments(req, res, next) {
  try {
    const filter = req.user.role === 'lecturer' ? { lecturer: req.user._id } : { status: 'Published' }
    const assignments = await populated(Assignment.find(filter).sort({ deadline: 1 }))
    res.json({ assignments })
  } catch (error) {
    next(error)
  }
}

export async function getAssignment(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      invalidIdResponse(res)
      return
    }
    const filter = req.user.role === 'lecturer'
      ? { _id: req.params.id, lecturer: req.user._id }
      : { _id: req.params.id, status: 'Published' }
    const assignment = await populated(Assignment.findOne(filter))
    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found.' })
      return
    }
    res.json({ assignment })
  } catch (error) {
    next(error)
  }
}

export async function createAssignment(req, res, next) {
  try {
    const data = validateAssignmentPayload(req.body)
    const assignment = await Assignment.create({ ...data, lecturer: req.user._id })
    res.status(201).json({ assignment: await populated(Assignment.findById(assignment._id)) })
  } catch (error) {
    handleWriteError(error, res, next)
  }
}

function findOwnedAssignment(id, lecturerId) {
  return Assignment.findOne({ _id: id, lecturer: lecturerId })
}

export async function updateAssignment(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      invalidIdResponse(res)
      return
    }
    const assignment = await findOwnedAssignment(req.params.id, req.user._id)
    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found or you do not own it.' })
      return
    }
    const data = validateAssignmentPayload({ ...assignment.toObject(), ...req.body })
    if (assignment.status !== 'Draft' && data.status === 'Draft') {
      res.status(409).json({ message: 'Published or closed assignments cannot be moved back to Draft.' })
      return
    }
    Object.assign(assignment, data)
    await assignment.save()
    res.json({ assignment: await populated(Assignment.findById(assignment._id)) })
  } catch (error) {
    handleWriteError(error, res, next)
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      invalidIdResponse(res)
      return
    }
    const assignment = await findOwnedAssignment(req.params.id, req.user._id)
    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found or you do not own it.' })
      return
    }
    await assignment.deleteOne()
    res.json({ message: 'Assignment deleted successfully.' })
  } catch (error) {
    next(error)
  }
}

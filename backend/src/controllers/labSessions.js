import mongoose from 'mongoose'
import LabSession from '../models/LabSession.js'

const fields = ['title', 'module', 'date', 'startTime', 'endTime', 'room', 'capacity', 'instructions', 'safetyNotes', 'status']

function validationError(message, errors = []) {
  const error = new Error(message)
  error.status = 400
  error.details = errors
  return error
}

function validatePayload(payload, partial = false) {
  const errors = []
  const data = {}
  fields.forEach((field) => {
    if (payload[field] !== undefined) data[field] = payload[field]
  })

  if (!partial || payload.title !== undefined) {
    if (!String(data.title || '').trim()) errors.push('Lab title is required.')
  }
  if (!partial || payload.module !== undefined) {
    if (!String(data.module || '').trim()) errors.push('Module is required.')
  }
  if (!partial || payload.date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || '')) errors.push('Date must use YYYY-MM-DD format.')
  }
  if (!partial || payload.startTime !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(data.startTime || '')) errors.push('Start time must use HH:mm format.')
  }
  if (!partial || payload.endTime !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(data.endTime || '')) errors.push('End time must use HH:mm format.')
  }
  if (data.startTime && data.endTime && data.endTime <= data.startTime) errors.push('End time must be later than start time.')
  if (!partial || payload.room !== undefined) {
    if (!String(data.room || '').trim()) errors.push('Room is required.')
  }
  if (!partial || payload.capacity !== undefined) {
    const capacity = Number(data.capacity)
    if (!Number.isInteger(capacity) || capacity < 1) errors.push('Capacity must be a whole number greater than zero.')
    else data.capacity = capacity
  }
  if (data.status !== undefined && !['Upcoming', 'Completed', 'Cancelled'].includes(data.status)) {
    errors.push('Status must be Upcoming, Completed, or Cancelled.')
  }
  if (errors.length) throw validationError('Validation failed.', errors)
  return data
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

async function populateSession(query) {
  return query.populate('lecturer', 'name email role')
}

export async function listLabSessions(req, res, next) {
  try {
    const sessions = await populateSession(LabSession.find().sort({ date: 1, startTime: 1 }))
    res.json({ sessions })
  } catch (error) {
    next(error)
  }
}

export async function getLabSession(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      res.status(404).json({ message: 'Lab session not found.' })
      return
    }
    const session = await populateSession(LabSession.findById(req.params.id))
    if (!session) {
      res.status(404).json({ message: 'Lab session not found.' })
      return
    }
    res.json({ session })
  } catch (error) {
    next(error)
  }
}

export async function createLabSession(req, res, next) {
  try {
    const data = validatePayload(req.body)
    const session = await LabSession.create({ ...data, lecturer: req.user._id })
    res.status(201).json({ session: await populateSession(LabSession.findById(session._id)) })
  } catch (error) {
    next(error)
  }
}

async function findOwnedSession(id, lecturerId) {
  if (!isValidId(id)) return null
  return LabSession.findOne({ _id: id, lecturer: lecturerId })
}

export async function updateLabSession(req, res, next) {
  try {
    const session = await findOwnedSession(req.params.id, req.user._id)
    if (!session) {
      res.status(404).json({ message: 'Lab session not found or you do not own it.' })
      return
    }
    const data = validatePayload({ ...session.toObject(), ...req.body })
    Object.assign(session, data)
    await session.save()
    res.json({ session: await populateSession(LabSession.findById(session._id)) })
  } catch (error) {
    next(error)
  }
}

export async function deleteLabSession(req, res, next) {
  try {
    const session = await findOwnedSession(req.params.id, req.user._id)
    if (!session) {
      res.status(404).json({ message: 'Lab session not found or you do not own it.' })
      return
    }
    await session.deleteOne()
    res.json({ message: 'Lab session deleted successfully.' })
  } catch (error) {
    next(error)
  }
}

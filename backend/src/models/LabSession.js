import mongoose from 'mongoose'

const labSessionSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Lab title is required'], trim: true },
  module: { type: String, required: [true, 'Module is required'], trim: true },
  date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format'] },
  startTime: { type: String, required: [true, 'Start time is required'], match: [/^\d{2}:\d{2}$/, 'Start time must use HH:mm format'] },
  endTime: { type: String, required: [true, 'End time is required'], match: [/^\d{2}:\d{2}$/, 'End time must use HH:mm format'] },
  room: { type: String, required: [true, 'Room is required'], trim: true },
  capacity: { type: Number, required: [true, 'Capacity is required'], min: [1, 'Capacity must be greater than zero'], validate: { validator: Number.isInteger, message: 'Capacity must be a whole number' } },
  instructions: { type: String, trim: true, default: '' },
  safetyNotes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Upcoming', 'Completed', 'Cancelled'], default: 'Upcoming' },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

const LabSession = mongoose.models.LabSession || mongoose.model('LabSession', labSessionSchema)

export default LabSession

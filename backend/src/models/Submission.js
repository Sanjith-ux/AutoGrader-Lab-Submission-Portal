import mongoose from 'mongoose'

const checkSchema = new mongoose.Schema({ passed: { type: Boolean, required: true }, message: { type: String, required: true } }, { _id: false })
const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  files: [{
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    type: { type: String, enum: ['PDF', 'DOCX', 'JPG', 'PNG', 'ZIP'], required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    attachment: { type: String, default: '' },
  }],
  submittedAt: { type: Date, required: true },
  timing: { type: String, enum: ['On time', 'Late'], required: true },
  requirements: {
    deadline: Date,
    allowedFileTypes: [String],
    maxFileSizeMB: Number,
    requiredFiles: [String],
    lateSubmissionAllowed: Boolean,
    totalMarks: Number,
  },
  compliance: {
    passed: { type: Boolean, required: true },
    checks: { deadline: checkSchema, fileType: checkSchema, fileSize: checkSchema, requiredFiles: checkSchema },
  },
  reviewStatus: { type: String, enum: ['Awaiting Review', 'Draft', 'Graded'], default: 'Awaiting Review' },
  marks: { type: Number, default: null, min: 0 },
  feedback: { type: String, default: '', maxlength: 5000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  withdrawnAt: { type: Date, default: null },
  withdrawnBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  withdrawalReason: { type: String, default: '', maxlength: 1000 },
  withdrawalHistory: [{
    action: { type: String, enum: ['Withdrawn', 'Restored'], required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, required: true },
  }],
}, { timestamps: true })

submissionSchema.index({ student: 1, submittedAt: -1 })
submissionSchema.index({ assignment: 1, submittedAt: -1 })

export default mongoose.models.Submission || mongoose.model('Submission', submissionSchema)

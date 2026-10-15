import mongoose from 'mongoose'

export const assignmentStatuses = ['Draft', 'Published', 'Closed']
export const allowedFileTypeValues = ['PDF', 'DOCX', 'JPG', 'PNG', 'ZIP']
export const assignmentLimits = {
  title: 150,
  module: 100,
  description: 5000,
  submissionRequirements: 2000,
  requiredFileName: 200,
  requiredFiles: 20,
  maxMarks: 1000,
  maxFileSizeMB: 100,
}

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Assignment title is required'], trim: true, maxlength: [assignmentLimits.title, `Assignment title must be ${assignmentLimits.title} characters or fewer`] },
  module: { type: String, required: [true, 'Module is required'], trim: true, maxlength: [assignmentLimits.module, `Module must be ${assignmentLimits.module} characters or fewer`] },
  description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: [assignmentLimits.description, `Description must be ${assignmentLimits.description} characters or fewer`] },
  deadline: { type: Date, required: [true, 'Deadline is required'] },
  submissionRequirements: { type: String, trim: true, default: '', maxlength: [assignmentLimits.submissionRequirements, `Submission requirements must be ${assignmentLimits.submissionRequirements} characters or fewer`] },
  totalMarks: { type: Number, required: [true, 'Total marks are required'], min: [1, 'Total marks must be greater than zero'], max: [assignmentLimits.maxMarks, `Total marks must be ${assignmentLimits.maxMarks} or fewer`], validate: { validator: Number.isInteger, message: 'Total marks must be a whole number' } },
  allowedFileTypes: { type: [{ type: String, enum: { values: allowedFileTypeValues, message: 'Unsupported file type {VALUE}' } }], validate: { validator: (value) => value.length > 0, message: 'At least one allowed file type is required' } },
  requiredFiles: { type: [{ type: String, trim: true, maxlength: assignmentLimits.requiredFileName }], validate: { validator: (value) => value.length > 0 && value.length <= assignmentLimits.requiredFiles, message: `Provide between 1 and ${assignmentLimits.requiredFiles} required files` } },
  maxFileSizeMB: { type: Number, required: [true, 'Maximum file size is required'], min: [1, 'Maximum file size must be greater than zero'], max: [assignmentLimits.maxFileSizeMB, `Maximum file size must be ${assignmentLimits.maxFileSizeMB} MB or less`], validate: { validator: Number.isInteger, message: 'Maximum file size must be a whole number' } },
  lateSubmissionAllowed: { type: Boolean, default: false },
  status: { type: String, enum: { values: assignmentStatuses, message: 'Status must be Draft, Published, or Closed' }, default: 'Draft' },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

assignmentSchema.index({ lecturer: 1, status: 1, deadline: 1 })
// A lecturer cannot have two assignments with the same title in the same module (case-insensitive).
assignmentSchema.index(
  { lecturer: 1, module: 1, title: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 }, name: 'unique_lecturer_module_title' },
)

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema)

export default Assignment

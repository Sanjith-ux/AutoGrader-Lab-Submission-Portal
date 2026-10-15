import { apiRequest } from './client.js'

export function assignmentToUi(assignment) {
  const deadline = new Date(assignment.deadline)
  return {
    ...assignment,
    id: assignment._id,
    subject: assignment.module,
    marks: assignment.totalMarks,
    maxFileSize: assignment.maxFileSizeMB,
    allowLateSubmissions: assignment.lateSubmissionAllowed,
    submissionRequirements: assignment.submissionRequirements || assignment.requiredFiles.join(', '),
    dueDateTime: assignment.deadline,
    dueDate: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(deadline),
    instructions: assignment.description,
    requiredExtensions: assignment.allowedFileTypes.map((type) => type.toLowerCase()),
    submissions: 0,
    studentStatus: deadline < new Date() ? 'Late' : 'Not submitted',
  }
}

export function assignmentToPayload(form) {
  return {
    title: form.title,
    module: form.subject,
    description: form.description,
    submissionRequirements: form.submissionRequirements,
    deadline: new Date(form.deadline).toISOString(),
    totalMarks: Number(form.totalMarks),
    allowedFileTypes: form.allowedFileTypes,
    requiredFiles: form.requiredFiles.split(',').map((item) => item.trim()).filter(Boolean),
    maxFileSizeMB: Number(form.maxFileSize),
    lateSubmissionAllowed: form.allowLateSubmissions,
    status: form.status,
  }
}

export async function fetchAssignments() {
  const { assignments } = await apiRequest('/assignments')
  return assignments.map(assignmentToUi)
}

export async function fetchAssignment(id) {
  const { assignment } = await apiRequest(`/assignments/${id}`)
  return assignmentToUi(assignment)
}

export async function createAssignmentRequest(form) {
  const { assignment } = await apiRequest('/assignments', { method: 'POST', body: JSON.stringify(assignmentToPayload(form)) })
  return assignmentToUi(assignment)
}

export async function updateAssignmentRequest(id, form) {
  const { assignment } = await apiRequest(`/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(assignmentToPayload(form)) })
  return assignmentToUi(assignment)
}

export async function deleteAssignmentRequest(id) {
  return apiRequest(`/assignments/${id}`, { method: 'DELETE' })
}

export async function updateAssignmentStatusRequest(id, status) {
  const { assignment } = await apiRequest(`/assignments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  return assignmentToUi(assignment)
}

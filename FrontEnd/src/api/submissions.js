import { apiRequest } from './client'

export function submissionToUi(value) {
  return {
    ...value,
    id: value._id,
    assignmentId: value.assignment._id,
    assignmentStatus: value.assignment.status,
    assignment: value.assignment.title,
    subject: value.assignment.module,
    student: value.student.name,
    email: value.student.email,
    status: value.withdrawnAt ? 'Withdrawn' : value.reviewStatus === 'Graded' ? 'Graded' : value.timing === 'Late' ? 'Late' : value.reviewStatus === 'Draft' ? 'Under Review' : 'Awaiting Review',
    mark: value.marks ?? '',
    totalMarks: value.requirements.totalMarks,
    fileName: value.files.map((file) => file.originalName).join(', '),
    fileNames: value.files.map((file) => file.originalName),
    fileType: value.files.map((file) => file.type).join(', '),
    fileSize: `${(value.files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB`,
    automaticCheck: value.compliance.passed ? 'Passed' : 'Failed',
    checks: Object.fromEntries(Object.entries(value.compliance.checks).map(([key, check]) => [key, check.passed ? 'Passed' : 'Failed'])),
  }
}

export async function fetchSubmissions(assignmentId, { view } = {}) {
  const params = new URLSearchParams()
  if (assignmentId) params.set('assignment', assignmentId)
  if (view) params.set('view', view)
  const { submissions } = await apiRequest(`/submissions${params.size ? `?${params}` : ''}`)
  return submissions.map(submissionToUi)
}

export async function changeSubmissionWithdrawal(id, action, reason) {
  const { submission } = await apiRequest(`/submissions/${id}/${action}`, { method: 'POST', body: JSON.stringify({ reason }) })
  return submissionToUi(submission)
}

export async function uploadSubmission(assignmentId, files, labels) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  body.append('attachments', JSON.stringify(labels))
  const { submission } = await apiRequest(`/submissions/assignments/${assignmentId}`, { method: 'POST', body })
  return submissionToUi(submission)
}

export async function reviewSubmission(id, review) {
  const { submission } = await apiRequest(`/submissions/${id}/review`, { method: 'PATCH', body: JSON.stringify(review) })
  return submissionToUi(submission)
}

export async function downloadFile(submissionId, file) {
  const blob = await apiRequest(`/submissions/${submissionId}/files/${file._id}`, { responseType: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.originalName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

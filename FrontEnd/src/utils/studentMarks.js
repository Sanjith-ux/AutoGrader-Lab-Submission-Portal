function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-GB') : 'Not submitted'
}

export function buildStudentMarksRecords(assignments, submissions) {
  const submittedAssignments = new Set(submissions.map((submission) => submission.assignmentId))
  // Each grade belongs to an attempt. A newer pending attempt must not hide it.
  const records = submissions.map((submission) => {
    const published = submission.reviewStatus === 'Graded'
    const hasMark = published && submission.mark !== '' && submission.mark != null
    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      title: submission.assignment,
      subject: submission.subject,
      submissionDate: formatDate(submission.submittedAt),
      mark: hasMark ? `${submission.mark} / ${submission.totalMarks}` : '—',
      percentage: hasMark ? Number(submission.mark) / submission.totalMarks * 100 : null,
      status: published ? 'Graded' : 'Under Review',
      lecturer: published ? submission.reviewedBy?.name || 'Lecturer' : 'Awaiting lecturer review',
      feedback: published ? submission.feedback : '',
      reviewedAt: published ? submission.reviewedAt : null,
      reviewedDate: published ? formatDate(submission.reviewedAt) : '',
      submittedAt: submission.submittedAt,
    }
  })
  for (const assignment of assignments) {
    if (!submittedAssignments.has(assignment.id)) records.push({ id: assignment.id, assignmentId: assignment.id, title: assignment.title, subject: assignment.subject, submissionDate: 'Not submitted', mark: '—', percentage: null, status: 'Not Submitted', lecturer: assignment.lecturer?.name || '', feedback: '', reviewedAt: null, reviewedDate: '' })
  }
  return records
}

export function latestGradedAssignments(records) {
  const latest = new Map()
  for (const record of records) {
    if (record.status !== 'Graded') continue
    const previous = latest.get(record.assignmentId)
    if (!previous || new Date(record.submittedAt) > new Date(previous.submittedAt)) latest.set(record.assignmentId, record)
  }
  return [...latest.values()]
}

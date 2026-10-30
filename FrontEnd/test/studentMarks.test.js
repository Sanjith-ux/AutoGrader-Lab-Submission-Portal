import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildStudentMarksRecords, latestGradedAssignments } from '../src/utils/studentMarks.js'

const published = {
  id: 'published-attempt', assignmentId: 'assignment-1', assignment: 'Lab report', subject: 'Testing',
  submittedAt: '2026-10-01T10:00:00Z', reviewStatus: 'Graded', mark: 42, totalMarks: 50,
  feedback: 'Published feedback', reviewedAt: '2026-10-02T10:00:00Z', reviewedBy: { name: 'Lecturer' },
}

test('a newer ungraded attempt does not hide an earlier published result or its feedback', () => {
  const pending = { ...published, id: 'new-attempt', submittedAt: '2026-10-03T10:00:00Z', reviewStatus: 'Awaiting Review', mark: '', feedback: '' }
  const records = buildStudentMarksRecords([], [pending, published])
  assert.equal(records.length, 2)
  assert.deepEqual(records.map((record) => record.id), ['new-attempt', 'published-attempt'])
  const graded = records.filter((record) => record.status === 'Graded')
  assert.equal(graded.length, 1)
  assert.equal(graded[0].mark, '42 / 50')
  assert.equal(graded[0].feedback, 'Published feedback')
  assert.equal(graded[0].assignmentId, 'assignment-1')
  assert.equal(records[0].mark, '—')
})

test('draft marks and feedback remain hidden even if supplied to the view mapper', () => {
  const [record] = buildStudentMarksRecords([], [{ ...published, reviewStatus: 'Draft' }])
  assert.equal(record.mark, '—')
  assert.equal(record.feedback, '')
  assert.equal(record.percentage, null)
  assert.equal(record.reviewedAt, null)
  assert.equal(record.status, 'Under Review')
})

test('a published zero mark is displayed and counted as graded', () => {
  const [record] = buildStudentMarksRecords([], [{ ...published, mark: 0 }])
  assert.equal(record.mark, '0 / 50')
  assert.equal(record.percentage, 0)
  assert.equal(record.status, 'Graded')
})

test('fresh API data displays updates to an already published attempt without caching the old score', () => {
  const first = buildStudentMarksRecords([], [published])
  const reloaded = buildStudentMarksRecords([], [{ ...published, mark: 47, feedback: 'Updated published feedback' }])
  assert.equal(first[0].mark, '42 / 50')
  assert.equal(reloaded[0].id, first[0].id)
  assert.equal(reloaded[0].mark, '47 / 50')
  assert.equal(reloaded[0].feedback, 'Updated published feedback')
})

test('all attempts retain their own grades while the summary counts each assignment once', () => {
  const newer = { ...published, id: 'newer-graded', mark: 27, totalMarks: 30, submittedAt: '2026-10-04T10:00:00Z' }
  const pending = { ...published, id: 'latest-pending', submittedAt: '2026-10-05T10:00:00Z', reviewStatus: 'Awaiting Review', mark: '' }
  const other = { ...published, id: 'other-assignment', assignmentId: 'assignment-2', mark: 10, totalMarks: 20 }
  const records = buildStudentMarksRecords([], [published, pending, newer, other])
  assert.equal(records.length, 4)
  const summary = latestGradedAssignments(records)
  assert.equal(summary.length, 2)
  assert.equal(summary.find((record) => record.assignmentId === 'assignment-1').id, 'newer-graded')
  assert.equal(summary.find((record) => record.assignmentId === 'assignment-1').percentage, 90)
})

test('closed assignments retain their published results and only unsubmitted assignments receive placeholders', () => {
  const records = buildStudentMarksRecords([{ id: 'assignment-1', title: 'Lab report' }, { id: 'assignment-2', title: 'New report' }], [published])
  assert.equal(records.length, 2)
  assert.equal(records[0].id, published.id)
  assert.equal(records[1].status, 'Not Submitted')
  assert.equal(buildStudentMarksRecords([], [published])[0].mark, '42 / 50')
})

test('withdrawn grades remain academic history and are excluded from grade summaries', () => {
  const withdrawn = { ...published, withdrawnAt: '2026-10-04T10:00:00Z', withdrawalReason: 'Duplicate attempt' }
  const [record] = buildStudentMarksRecords([], [withdrawn])
  assert.equal(record.status, 'Withdrawn')
  assert.equal(record.mark, '42 / 50')
  assert.equal(record.feedback, 'Published feedback')
  assert.equal(record.withdrawalReason, 'Duplicate attempt')
  assert.equal(record.percentage, null)
  assert.deepEqual(latestGradedAssignments([record]), [])
})

test('withdrawal does not expose draft marks; restoration restores the grade summary', () => {
  const draft = { ...published, reviewStatus: 'Draft', withdrawnAt: '2026-10-04T10:00:00Z' }
  const [privateRecord] = buildStudentMarksRecords([], [draft])
  assert.equal(privateRecord.status, 'Withdrawn')
  assert.equal(privateRecord.mark, '—')
  assert.equal(privateRecord.feedback, '')
  const [restored] = buildStudentMarksRecords([], [{ ...published, withdrawnAt: null }])
  assert.equal(restored.status, 'Graded')
  assert.equal(latestGradedAssignments([restored]).length, 1)
})

test('withdrawing a newer grade leaves an earlier active published grade in the summary', () => {
  const withdrawn = { ...published, id: 'withdrawn-newer', submittedAt: '2026-10-05T10:00:00Z', mark: 49, withdrawnAt: '2026-10-06T10:00:00Z' }
  const records = buildStudentMarksRecords([], [withdrawn, published])
  assert.equal(records.length, 2)
  assert.equal(latestGradedAssignments(records)[0].id, published.id)
})

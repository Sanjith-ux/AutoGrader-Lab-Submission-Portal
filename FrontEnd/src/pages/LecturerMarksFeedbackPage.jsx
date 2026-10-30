import { useEffect, useState } from 'react'
import LecturerSidebar from '../components/LecturerSidebar'
import { fetchSubmissions, reviewSubmission } from '../api/submissions'
import SubmissionChecks from '../components/SubmissionChecks'
import SubmissionFiles from '../components/SubmissionFiles'

const statuses = ['All', 'Awaiting Review', 'Draft Feedback', 'Graded']

function formatDate(date) {
  if (!date) return 'Not submitted'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(date))
}

function FeedbackStatus({ value }) {
  return <span className={`feedback-record-status ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
}

function toRecord(submission) {
  return { ...submission, submittedDate: submission.submittedAt, status: submission.reviewStatus === 'Draft' ? 'Draft Feedback' : submission.reviewStatus, feedbackStatus: submission.reviewStatus === 'Graded' ? 'Published' : submission.reviewStatus === 'Draft' ? 'Draft saved' : 'Not published' }
}

function LecturerMarksFeedbackPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let current = true
    fetchSubmissions().then((submissions) => { if (current) setRecords(submissions.map(toRecord)) }).catch((error) => { if (current) setRequestError(error.message) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])
  const [assignmentFilter, setAssignmentFilter] = useState('All assignments')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draftMark, setDraftMark] = useState('')
  const [draftFeedback, setDraftFeedback] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const selectedRecord = records.find((record) => record.id === selectedId)
  const assignments = ['All assignments', ...new Set(records.map((record) => record.assignment))]
  const visibleRecords = records.filter((record) => {
    const matchesAssignment = assignmentFilter === 'All assignments' || record.assignment === assignmentFilter
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter
    const searchValue = search.trim().toLowerCase()
    const matchesSearch = !searchValue || record.student.toLowerCase().includes(searchValue) || record.email.toLowerCase().includes(searchValue)
    return matchesAssignment && matchesStatus && matchesSearch
  })
  const gradedRecords = records.filter((record) => record.status === 'Graded')
  const averageMark = gradedRecords.length ? Math.round(gradedRecords.reduce((total, record) => total + (Number(record.mark) / record.totalMarks) * 100, 0) / gradedRecords.length) : 0
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7)
  weekStart.setHours(0, 0, 0, 0)
  const summary = [
    { label: 'Total graded submissions', value: gradedRecords.length, tone: 'green' },
    { label: 'Awaiting review', value: records.filter((record) => record.status === 'Awaiting Review').length, tone: 'gold' },
    { label: 'Average mark', value: `${averageMark}%`, tone: 'blue' },
    { label: 'Feedback published this week', value: gradedRecords.filter((record) => new Date(record.reviewedAt) >= weekStart).length, tone: 'rose' },
  ]

  function reviewRecord(record) {
    setSelectedId(record.id)
    setDraftMark(record.mark === '' ? '' : String(record.mark))
    setDraftFeedback(record.feedback)
    setFormError('')
    setSuccessMessage('')
  }

  function validateMark() {
    if (draftMark === '') {
      setFormError('Enter a mark before saving or publishing feedback.')
      return false
    }
    if (Number.isNaN(Number(draftMark)) || Number(draftMark) < 0 || Number(draftMark) > selectedRecord.totalMarks) {
      setFormError(`Enter a mark from 0 to ${selectedRecord.totalMarks}.`)
      return false
    }
    return true
  }

  async function persistReview(reviewStatus) {
    if (saving) return
    if ((reviewStatus === 'Graded' || draftMark !== '') && !validateMark()) return
    setFormError('')
    setSuccessMessage('')
    setSaving(true)
    try {
      const updated = toRecord(await reviewSubmission(selectedRecord.id, { marks: draftMark === '' ? null : Number(draftMark), feedback: draftFeedback, reviewStatus }))
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
      setSuccessMessage(reviewStatus === 'Graded' ? 'Marks and feedback published.' : 'Draft saved. Marks and feedback are hidden from the student.')
    } catch (error) { setFormError(error.message) } finally { setSaving(false) }
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Marks &amp; Feedback</h1><p className="student-header-copy">Review, update, and publish student marks and feedback.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content marks-management-content">
          {loading && <p role="status">Loading marks and feedback…</p>}{requestError && <p className="field-error" role="alert">{requestError}</p>}
          <section className="marks-management-summary" aria-label="Marks and feedback summary">{summary.map((item) => <article className="summary-card marks-management-summary-card" key={item.label}><div className="summary-card-top"><span className={`card-icon ${item.tone}-icon`}>↗</span><span className="card-label">{item.label}</span></div><p className="large-stat">{item.value}</p><p className="summary-meta">Across all assignments</p></article>)}</section>

          <section className="marks-filter-panel" aria-label="Marks and feedback filters"><div className="marks-filter-field"><label htmlFor="marks-assignment-filter">Assignment</label><select id="marks-assignment-filter" value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)}>{assignments.map((assignment) => <option key={assignment}>{assignment}</option>)}</select></div><div className="marks-filter-field"><label htmlFor="marks-status-filter">Status</label><select id="marks-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="marks-filter-field marks-search-field"><label htmlFor="marks-student-search">Search student</label><input id="marks-student-search" type="search" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></div></section>

          <div className="marks-management-layout">
            <section className="lecturer-assignment-table-wrap" aria-label="Marks and feedback records">
              {loading || requestError ? null : visibleRecords.length === 0 ? <div className="empty-state lecturer-empty"><strong>No records match these filters</strong><p>Try clearing a filter or searching for another student.</p></div> : <div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table marks-table"><thead><tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>Current mark</th><th>Status</th><th>Feedback</th><th>Action</th></tr></thead><tbody>{visibleRecords.map((record) => <tr className={selectedId === record.id ? 'selected' : ''} key={record.id}><td><strong>{record.student}</strong><small>{record.email}</small></td><td>{record.assignment}<small>{record.subject}</small></td><td>{formatDate(record.submittedDate)}</td><td>{record.mark === '' ? '—' : `${record.mark} / ${record.totalMarks}`}</td><td><FeedbackStatus value={record.status} /></td><td><FeedbackStatus value={record.feedbackStatus} /></td><td><button className="details-button" type="button" disabled={saving} onClick={() => reviewRecord(record)}>Review/Edit</button></td></tr>)}</tbody></table></div>}
            </section>

            {selectedRecord && <aside className="lecturer-assignment-detail marks-review-panel"><div className="section-heading"><div><p className="eyebrow">Review submission</p><h2>{selectedRecord.student}</h2></div><FeedbackStatus value={selectedRecord.status} /></div><p className="assignment-detail-subject">{selectedRecord.email} · {selectedRecord.assignment}</p><div className="assignment-detail-meta"><span><strong>Assignment</strong>{selectedRecord.assignment}</span><span><strong>Subject</strong>{selectedRecord.subject}</span><span><strong>Submitted</strong>{formatDate(selectedRecord.submittedDate)}</span><span><strong>Total marks</strong>{selectedRecord.totalMarks}</span></div>{!selectedRecord.submittedDate && <p className="marks-review-message awaiting">This assignment has not been submitted yet. Feedback can be prepared once a submission is received.</p>}{selectedRecord.submittedDate && selectedRecord.status === 'Awaiting Review' && <p className="marks-review-message awaiting">This submission is awaiting your review.</p>}<div className="detail-block"><h4>Automatic submission checks</h4><SubmissionChecks compliance={selectedRecord.compliance} /></div><div className="detail-block"><h4>Uploaded files</h4><SubmissionFiles submission={selectedRecord} /></div><div className="marks-review-form"><div className="field-group"><label htmlFor="marks-input">Mark <small>(out of {selectedRecord.totalMarks})</small></label><input id="marks-input" disabled={saving} type="number" min="0" max={selectedRecord.totalMarks} value={draftMark} onChange={(event) => { setDraftMark(event.target.value); setFormError('') }} aria-invalid={Boolean(formError)} /></div><div className="field-group"><label htmlFor="marks-feedback">Lecturer feedback</label><textarea id="marks-feedback" disabled={saving} rows="3" value={draftFeedback} onChange={(event) => { setDraftFeedback(event.target.value); setFormError('') }} placeholder="Summarise the student's performance" /></div>{formError && <p className="field-error" role="alert">{formError}</p>}<div className="marks-review-actions"><button className="secondary-action-button" type="button" disabled={saving} onClick={() => persistReview('Draft')}>Save Draft</button><button className="primary-action-button" type="button" disabled={saving} onClick={() => persistReview('Graded')}>Publish Feedback <span aria-hidden="true">→</span></button></div>{successMessage && <p className="marks-success" role="status">{successMessage}</p>}</div></aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LecturerMarksFeedbackPage

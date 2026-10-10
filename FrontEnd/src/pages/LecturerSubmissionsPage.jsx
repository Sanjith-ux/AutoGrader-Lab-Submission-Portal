import { useState, useSyncExternalStore } from 'react'
import LecturerSidebar from '../components/LecturerSidebar'
import { getSubmissions, subscribe, updateSubmission } from '../data/lecturerSubmissions'

const statusFilters = ['All', 'Awaiting Review', 'Graded', 'Late', 'Missing']
const assignmentFilters = ['All assignments', 'HCI Observation Report', 'Database Query Results', 'Network Topology Design', 'Software Testing Log']

function formatSubmittedAt(value) {
  if (!value) return 'No submission received'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function StatusPill({ value, className = '' }) {
  return <span className={`submission-pill ${value.toLowerCase().replaceAll(' ', '-')} ${className}`}>{value}</span>
}

function LecturerSubmissionsPage() {
  const submissions = useSyncExternalStore(subscribe, getSubmissions)
  const [assignmentFilter, setAssignmentFilter] = useState('All assignments')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draftMark, setDraftMark] = useState('')
  const [draftFeedback, setDraftFeedback] = useState('')
  const [markError, setMarkError] = useState('')
  const selectedSubmission = submissions.find((submission) => submission.id === selectedId)

  const visibleSubmissions = submissions.filter((submission) => {
    const matchesAssignment = assignmentFilter === 'All assignments' || submission.assignment === assignmentFilter
    const matchesStatus = statusFilter === 'All' || submission.status === statusFilter
    const matchesSearch = submission.student.toLowerCase().includes(search.trim().toLowerCase())
    return matchesAssignment && matchesStatus && matchesSearch
  })

  const summary = [
    { label: 'Total submissions', value: submissions.length, tone: 'green' },
    { label: 'Awaiting review', value: submissions.filter((submission) => submission.status === 'Awaiting Review').length, tone: 'blue' },
    { label: 'Late submissions', value: submissions.filter((submission) => submission.status === 'Late').length, tone: 'gold' },
    { label: 'Graded submissions', value: submissions.filter((submission) => submission.status === 'Graded').length, tone: 'rose' },
  ]

  function reviewSubmission(submission) {
    setSelectedId(submission.id)
    setDraftMark(submission.mark)
    setDraftFeedback(submission.feedback)
    setMarkError('')
  }

  function validateMark() {
    if (draftMark === '' || Number.isNaN(Number(draftMark)) || Number(draftMark) < 0 || Number(draftMark) > selectedSubmission.totalMarks) {
      setMarkError(`Enter a mark from 0 to ${selectedSubmission.totalMarks}.`)
      return false
    }
    setMarkError('')
    return true
  }

  function saveDraft(event) {
    event.preventDefault()
    if (!validateMark()) return
    updateSubmission(selectedSubmission.id, { mark: draftMark, feedback: draftFeedback })
  }

  function publishFeedback(event) {
    event.preventDefault()
    if (!validateMark()) return
    updateSubmission(selectedSubmission.id, { mark: draftMark, feedback: draftFeedback, status: 'Graded' })
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Student Submissions</h1><p className="student-header-copy">Review student submissions and automatic requirement-check results before providing feedback.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content submissions-management-content">
          <section className="submission-summary-grid" aria-label="Submission summary">{summary.map((item) => <article className="summary-card submission-summary-card" key={item.label}><div className="summary-card-top"><span className={`card-icon ${item.tone}-icon`}>◷</span><span className="card-label">{item.label}</span></div><p className="large-stat">{item.value}</p><p className="summary-meta">Across all assignments</p></article>)}</section>

          <section className="submission-filter-panel" aria-label="Submission filters"><div className="submission-filter-field"><label htmlFor="assignment-filter">Assignment</label><select id="assignment-filter" value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)}>{assignmentFilters.map((item) => <option key={item}>{item}</option>)}</select></div><div className="submission-filter-field"><label htmlFor="status-filter">Submission status</label><select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusFilters.map((item) => <option key={item}>{item}</option>)}</select></div><div className="submission-filter-field submission-search-field"><label htmlFor="student-search">Search student</label><input id="student-search" type="search" placeholder="Search by student name" value={search} onChange={(event) => setSearch(event.target.value)} /></div></section>

          <div className="submission-management-layout">
            <section className="lecturer-assignment-table-wrap" aria-label="Student submission list">
              {visibleSubmissions.length === 0 ? <div className="empty-state lecturer-empty"><strong>No submissions match these filters</strong><p>Try clearing a filter or searching for another student.</p></div> : <div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table submissions-table"><thead><tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>File</th><th>Automatic checks</th><th>Status</th><th>Mark</th><th>Action</th></tr></thead><tbody>{visibleSubmissions.map((submission) => <tr className={selectedId === submission.id ? 'selected' : ''} key={submission.id}><td><strong>{submission.student}</strong><small>{submission.email}</small></td><td>{submission.assignment}<small>{submission.subject}</small></td><td>{formatSubmittedAt(submission.submittedAt)}</td><td>{submission.fileName || 'No file uploaded'}{submission.fileType && <small>{submission.fileType} · {submission.fileSize}</small>}</td><td><StatusPill value={submission.automaticCheck} /></td><td><StatusPill value={submission.status} /></td><td>{submission.mark ? `${submission.mark} / ${submission.totalMarks}` : '—'}</td><td><button className="details-button" type="button" onClick={() => reviewSubmission(submission)}>Review</button></td></tr>)}</tbody></table></div>}
            </section>

            {selectedSubmission && <aside className="lecturer-assignment-detail submission-review-panel"><div className="section-heading"><div><p className="eyebrow">Review submission</p><h2>{selectedSubmission.student}</h2></div><StatusPill value={selectedSubmission.status} /></div><p className="assignment-detail-subject">{selectedSubmission.assignment}</p><div className="assignment-detail-meta"><span><strong>Student</strong>{selectedSubmission.student}</span><span><strong>Assignment</strong>{selectedSubmission.assignment}</span><span><strong>Submitted</strong>{formatSubmittedAt(selectedSubmission.submittedAt)}</span></div><div className="detail-block"><h4>Uploaded file</h4>{selectedSubmission.fileName ? <div className="uploaded-file"><span className="file-type">{selectedSubmission.fileType}</span><span><strong>{selectedSubmission.fileName}</strong><small>{selectedSubmission.fileSize}</small></span></div> : <p className="review-message missing-message">No file was uploaded. This submission is marked as missing.</p>}<button className="secondary-action-button download-button" type="button" disabled={!selectedSubmission.fileName}>Download file <span aria-hidden="true">↓</span></button></div><div className="detail-block automatic-checks-panel"><h4>Automatic checks</h4>{Object.entries({ deadline: 'Deadline', fileType: 'Allowed file type', requiredFiles: 'Required files', fileSize: 'File size' }).map(([key, label]) => <div className="check-row" key={key}><span>{label}</span><StatusPill value={selectedSubmission.checks[key]} /></div>)}</div>{selectedSubmission.status === 'Late' && <p className="review-message late-message">This submission was received after the assignment deadline.</p>}{selectedSubmission.status === 'Awaiting Review' && <p className="review-message awaiting-message">This submission is ready for your review.</p>}<form className="review-form" onSubmit={(event) => event.preventDefault()} noValidate><div className="field-group"><label htmlFor="lecturer-mark">Lecturer mark <small>(out of {selectedSubmission.totalMarks})</small></label><input id="lecturer-mark" type="number" min="0" max={selectedSubmission.totalMarks} value={draftMark} onChange={(event) => { setDraftMark(event.target.value); setMarkError('') }} aria-invalid={Boolean(markError)} />{markError && <p className="field-error">{markError}</p>}</div><div className="field-group"><label htmlFor="lecturer-feedback">Lecturer feedback</label><textarea id="lecturer-feedback" rows="4" value={draftFeedback} onChange={(event) => setDraftFeedback(event.target.value)} placeholder="Share feedback for the student" /></div><div className="review-actions"><button className="secondary-action-button" type="button" onClick={saveDraft}>Save Draft</button><button className="primary-action-button" type="button" onClick={publishFeedback}>Publish Feedback <span aria-hidden="true">→</span></button></div></form></aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LecturerSubmissionsPage

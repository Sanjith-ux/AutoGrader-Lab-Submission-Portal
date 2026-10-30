import TableScroll from '../components/TableScroll'
import { useEffect, useState } from 'react'
import StudentSidebar from '../components/StudentSidebar'
import { fetchAssignments } from '../api/assignments'
import { fetchSubmissions } from '../api/submissions'
import { buildStudentMarksRecords, latestGradedAssignments } from '../utils/studentMarks'

const filters = ['All', 'Graded', 'Under Review', 'Not Submitted']

function StatusBadge({ status }) {
  return <span className={`marks-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function MarksFeedbackPage() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [marksRecords, setMarksRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    Promise.all([fetchAssignments(), fetchSubmissions()]).then(([assignments, submissions]) => {
      if (!current) return
      setMarksRecords(buildStudentMarksRecords(assignments, submissions))
    }).catch((error) => { if (current) setError(error.message) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])
  const visibleRecords = marksRecords.filter((record) => filter === 'All' || record.status === filter)
  const selectedRecord = visibleRecords.find((record) => record.id === selectedId) || visibleRecords[0]
  const gradedRecords = latestGradedAssignments(marksRecords)
  const overallAverage = gradedRecords.length ? Math.round(gradedRecords.reduce((total, record) => total + record.percentage, 0) / gradedRecords.length) : 0
  const mostRecent = marksRecords.filter((record) => record.status === 'Graded').sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))[0]

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main marks-feedback-main">
        <header className="student-header assignments-header">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Marks &amp; Feedback</h1>
            <p className="student-header-copy">Review your marks, lecturer feedback, and progress across your laboratory work.</p>
          </div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content marks-feedback-content">
          {loading && <p role="status">Loading marks and feedback…</p>}{error && <p className="field-error" role="alert">{error}</p>}
          <section className="marks-summary" aria-label="Marks summary">
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon green-icon">%</span><span className="card-label">Overall average mark</span></div><p className="large-stat">{overallAverage}<span>%</span></p><p className="summary-meta">Across graded assignments</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon blue-icon">✓</span><span className="card-label">Assignments graded</span></div><p className="large-stat">{gradedRecords.length}</p><p className="summary-meta">Feedback is available to review</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon gold-icon">◷</span><span className="card-label">Awaiting review</span></div><p className="large-stat">{marksRecords.filter((record) => record.status === 'Under Review').length}</p><p className="summary-meta">Lecturer feedback is pending</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon rose-icon">↗</span><span className="card-label">Most recent feedback</span></div><p className="marks-date-stat">{mostRecent?.reviewedDate || '—'}</p><p className="summary-meta">{mostRecent?.title || 'No published feedback yet'}</p></article>
          </section>

          <div className="assignment-toolbar marks-toolbar">
            <div><p className="eyebrow">Assessment progress</p><h2>Your laboratory work</h2></div>
            <div className="assignment-filters" aria-label="Marks and feedback filters">
              {filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>
          <p className="summary-meta">Each row is a submission attempt. Published results remain available when a newer attempt is awaiting review. The average uses the latest graded attempt per assignment.</p>

          <div className="marks-layout">
            <section className="marks-table-wrap" aria-label={`${filter} marks and feedback`}>
              {loading || error ? null : visibleRecords.length === 0 ? <div className="empty-state marks-empty"><strong>No marks or feedback</strong><p>There are no assignments matching this filter yet.</p></div> : (
                <TableScroll className="marks-table-scroll" label="My marks and feedback">
                  <table className="marks-table">
                    <thead><tr><th>Assignment</th><th>Submitted</th><th>Mark</th><th>Status</th><th /></tr></thead>
                    <tbody>{visibleRecords.map((record) => <tr className={selectedRecord?.id === record.id ? 'selected' : ''} key={record.id}>
                      <td><strong>{record.title}</strong><small>{record.subject}</small></td>
                      <td>{record.submissionDate}</td>
                      <td className="mark-cell">{record.mark}</td>
                      <td><StatusBadge status={record.status} /></td>
                      <td><button className="details-button" type="button" onClick={() => setSelectedId(record.id)}>View feedback</button></td>
                    </tr>)}</tbody>
                  </table>
                </TableScroll>
              )}
            </section>

            {selectedRecord && <aside className="marks-detail-panel">
              <div className="section-heading"><div><p className="eyebrow">Feedback details</p><h2>{selectedRecord.title}</h2></div><StatusBadge status={selectedRecord.status} /></div>
              <div className="marks-detail-meta"><span><strong>Subject</strong>{selectedRecord.subject}</span><span><strong>Submission date</strong>{selectedRecord.submissionDate}</span><span><strong>Mark</strong>{selectedRecord.mark}</span><span><strong>Lecturer</strong>{selectedRecord.lecturer}</span></div>
              {selectedRecord.status === 'Graded' ? <>
                <div className="detail-block"><h4>Feedback comments</h4><p>{selectedRecord.feedback}</p></div>
                <div className="detail-block"><h4>Date reviewed</h4><p>{selectedRecord.reviewedDate}</p></div>
              </> : <div className={`marks-notice ${selectedRecord.status === 'Not Submitted' ? 'not-submitted-notice' : ''}`}><h4>{selectedRecord.status === 'Under Review' ? 'Feedback is on its way' : 'No feedback available yet'}</h4><p>{selectedRecord.status === 'Under Review' ? 'Your lecturer is still reviewing this submission. The mark and detailed feedback will appear here once the review is complete.' : 'Submit this assignment to receive a mark and lecturer feedback.'}</p></div>}
            </aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default MarksFeedbackPage

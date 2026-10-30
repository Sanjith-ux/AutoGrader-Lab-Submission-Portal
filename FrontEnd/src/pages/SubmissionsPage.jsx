import TableScroll from '../components/TableScroll'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'
import { fetchSubmissions } from '../api/submissions'
import SubmissionChecks from '../components/SubmissionChecks'
import SubmissionFiles from '../components/SubmissionFiles'

const filters = ['All', 'Awaiting Review', 'Late', 'Under Review', 'Graded']

function StatusBadge({ value }) {
  return <span className={`submission-badge ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
}

function SubmissionsPage() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    fetchSubmissions().then(setSubmissions).catch((error) => setError(error.message)).finally(() => setLoading(false))
  }, [])
  const visibleSubmissions = submissions.filter((submission) => filter === 'All' || (filter === 'Late' ? submission.timing === 'Late' : submission.status === filter))
  const selectedSubmission = submissions.find((submission) => submission.id === selectedId) || visibleSubmissions[0]
  const selectedAssignment = selectedSubmission && { title: selectedSubmission.assignment, id: selectedSubmission.assignmentId, dueDate: new Date(selectedSubmission.requirements.deadline).toLocaleString() }

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main submissions-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Student workspace</p><h1>My Submissions</h1><p className="student-header-copy">Review your uploaded work, automatic checks, and lecturer feedback.</p></div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content submissions-content">
          <div className="assignment-toolbar submissions-toolbar">
            <div><p className="eyebrow">Submission history</p><h2>Uploaded coursework</h2></div>
            <div className="assignment-filters" aria-label="Submission filters">
              {filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>

          <div>{loading && <p role="status">Loading submissions…</p>}{error && <p className="field-error" role="alert">{error}</p>}</div>
          <div className="submissions-layout">
            <section className="submission-table-wrap" aria-label={`${filter} submissions`}>
              {visibleSubmissions.length === 0 ? <div className="empty-state submissions-empty"><strong>No submissions yet</strong><p>Uploaded assignments will appear here once you submit your work.</p><Link className="assignment-link" to="/student/assignments">Browse assignments <span aria-hidden="true">→</span></Link></div> : (
                <TableScroll className="submission-table-scroll" label="My submissions">
                  <table className="submission-table">
                    <thead><tr><th>Assignment</th><th>Submitted</th><th>File</th><th>Status</th><th>Auto-check</th><th>Mark</th><th /></tr></thead>
                    <tbody>{visibleSubmissions.map((submission) => {
                      const assignment = { title: submission.assignment, subject: submission.subject }
                      return <tr className={selectedId === submission.id ? 'selected' : ''} key={submission.id}>
                        <td><strong>{assignment.title}</strong><small>{assignment.subject}</small></td><td>{new Date(submission.submittedAt).toLocaleString()}</td><td>{submission.fileNames.join(', ')}</td><td><StatusBadge value={submission.status} /></td><td><StatusBadge value={submission.automaticCheck} /></td><td>{submission.mark === '' ? '—' : `${submission.mark} / ${submission.totalMarks}`}</td><td><button className="details-button" type="button" onClick={() => setSelectedId(submission.id)}>View details</button></td>
                      </tr>
                    })}</tbody>
                  </table>
                </TableScroll>
              )}
            </section>

            {selectedSubmission && selectedAssignment && <aside className="submission-detail-panel">
              <div className="section-heading"><div><p className="eyebrow">Submission details</p><h2>{selectedAssignment.title}</h2></div><StatusBadge value={selectedSubmission.status} /></div>
              <div className="submission-detail-meta"><span><strong>Submitted</strong>{new Date(selectedSubmission.submittedAt).toLocaleString()}</span><span><strong>Deadline</strong>{selectedAssignment.dueDate}</span><span><strong>Mark</strong>{selectedSubmission.mark === '' ? 'Not available yet' : `${selectedSubmission.mark} / ${selectedSubmission.totalMarks}`}</span></div>
              <div className="detail-block"><h4>Uploaded files</h4><SubmissionFiles submission={selectedSubmission} /></div>
              <div className="detail-block"><h4>Automatic submission check</h4><SubmissionChecks compliance={selectedSubmission.compliance} /></div>
              <div className="detail-block"><h4>Deadline status</h4><p className={selectedSubmission.timing === 'Late' ? 'deadline-late' : ''}>{selectedSubmission.timing === 'Late' ? 'Submitted after the deadline.' : 'Submitted before the deadline.'}</p></div>
              <div className="detail-block"><h4>Lecturer feedback</h4><p>{selectedSubmission.feedback || 'No published lecturer feedback yet.'}</p></div>
              {selectedSubmission.reviewStatus !== 'Graded' && <Link className="submit-button resubmit-button" to={`/student/assignments/${selectedAssignment.id}`}>Resubmit <span aria-hidden="true">→</span></Link>}
            </aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default SubmissionsPage

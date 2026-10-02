import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'
import { assignments, getAssignmentStatus } from '../data/assignments'

const filters = ['All', 'Submitted', 'Late', 'Under Review', 'Graded']

const sampleSubmissions = {
  'hci-lab-report': { submittedAt: '02 Oct 2026 · 16:42', fileNames: ['hci-observation-report.pdf'], automaticCheck: 'Passed', feedback: 'Your report is queued for lecturer review.', mark: null, sampleStatus: 'Submitted', acceptingSubmissions: true },
  'network-diagram': { submittedAt: '29 Sep 2026 · 08:16', fileNames: ['network-topology.png', 'network-explanation.pdf'], automaticCheck: 'Warning', feedback: 'Please review the addressing explanation before the next submission window.', mark: null, sampleStatus: 'Late', acceptingSubmissions: false },
  'database-results': { submittedAt: '01 Oct 2026 · 11:05', fileNames: ['query-results.docx', 'supporting-files.zip'], automaticCheck: 'Passed', feedback: 'The indexed query comparison is clear. Your lecturer will add feedback soon.', mark: null, sampleStatus: 'Under Review', acceptingSubmissions: true },
  'programming-reflection': { submittedAt: '22 Sep 2026 · 21:34', fileNames: ['programming-reflection.pdf'], automaticCheck: 'Needs Attention', feedback: 'Strong reflection. Add more detail about your testing decisions in the next iteration.', mark: '8 / 10', sampleStatus: 'Graded', acceptingSubmissions: false },
}

function getSubmission(assignment) {
  const sample = sampleSubmissions[assignment.id]
  const currentStatus = getAssignmentStatus(assignment.id)
  const status = ['Submitted', 'Late', 'Under Review', 'Graded'].includes(currentStatus) ? currentStatus : sample.sampleStatus
  return { ...sample, id: assignment.id, status }
}

function StatusBadge({ value }) {
  return <span className={`submission-badge ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>
}

function SubmissionsPage() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const submissions = assignments.map(getSubmission)
  const visibleSubmissions = submissions.filter((submission) => filter === 'All' || submission.status === filter)
  const selectedSubmission = submissions.find((submission) => submission.id === selectedId) || visibleSubmissions[0]
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedSubmission?.id)

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

          <div className="submissions-layout">
            <section className="submission-table-wrap" aria-label={`${filter} submissions`}>
              {visibleSubmissions.length === 0 ? <div className="empty-state submissions-empty"><strong>No submissions yet</strong><p>Uploaded assignments will appear here once you submit your work.</p><Link className="assignment-link" to="/student/assignments">Browse assignments <span aria-hidden="true">→</span></Link></div> : (
                <div className="submission-table-scroll">
                  <table className="submission-table">
                    <thead><tr><th>Assignment</th><th>Submitted</th><th>File</th><th>Status</th><th>Auto-check</th><th>Mark</th><th /></tr></thead>
                    <tbody>{visibleSubmissions.map((submission) => {
                      const assignment = assignments.find((item) => item.id === submission.id)
                      return <tr className={selectedId === submission.id ? 'selected' : ''} key={submission.id}>
                        <td><strong>{assignment.title}</strong><small>{assignment.subject}</small></td><td>{submission.submittedAt}</td><td>{submission.fileNames.join(', ')}</td><td><StatusBadge value={submission.status} /></td><td><StatusBadge value={submission.automaticCheck} /></td><td>{submission.mark || '—'}</td><td><button className="details-button" type="button" onClick={() => setSelectedId(submission.id)}>View details</button></td>
                      </tr>
                    })}</tbody>
                  </table>
                </div>
              )}
            </section>

            {selectedSubmission && selectedAssignment && <aside className="submission-detail-panel">
              <div className="section-heading"><div><p className="eyebrow">Submission details</p><h2>{selectedAssignment.title}</h2></div><StatusBadge value={selectedSubmission.status} /></div>
              <div className="submission-detail-meta"><span><strong>Submitted</strong>{selectedSubmission.submittedAt}</span><span><strong>Deadline</strong>{selectedAssignment.dueDate} · 23:59</span><span><strong>Mark</strong>{selectedSubmission.mark || 'Not available yet'}</span></div>
              <div className="detail-block"><h4>Uploaded files</h4><ul className="required-files">{selectedSubmission.fileNames.map((fileName) => <li key={fileName}>{fileName}</li>)}</ul></div>
              <div className="detail-block"><h4>Automatic submission check</h4><p><StatusBadge value={selectedSubmission.automaticCheck} /> All uploaded files were checked when this submission was received.</p></div>
              <div className="detail-block"><h4>Deadline status</h4><p className={selectedSubmission.status === 'Late' ? 'deadline-late' : ''}>{selectedSubmission.status === 'Late' ? 'Submitted after the deadline.' : 'Submitted before the deadline.'}</p></div>
              <div className="detail-block"><h4>Lecturer feedback</h4><p>{selectedSubmission.feedback}</p></div>
              {selectedSubmission.acceptingSubmissions && <Link className="submit-button resubmit-button" to={`/student/assignments/${selectedAssignment.id}`}>Resubmit <span aria-hidden="true">→</span></Link>}
            </aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default SubmissionsPage

import { useState } from 'react'
import StudentSidebar from '../components/StudentSidebar'

const filters = ['All', 'Graded', 'Under Review', 'Not Submitted']

const marksRecords = [
  {
    id: 'hci-observation',
    title: 'HCI Observation Report',
    subject: 'Human Computer Interaction',
    submissionDate: '02 Oct 2026',
    mark: '82 / 100',
    status: 'Graded',
    lecturer: 'Dr. Amina Malik',
    feedback: 'A thoughtful report with clear observations and a well-organised analysis of the user sessions.',
    strengths: 'Your observation notes are detailed, and you connected the findings to the usability principles covered in the lab.',
    improvements: 'Support the final recommendations with two more specific examples from your observation data.',
    reviewedDate: '06 Oct 2026',
  },
  {
    id: 'network-topology',
    title: 'Network Topology Design',
    subject: 'Network Design',
    submissionDate: '29 Sep 2026',
    mark: '—',
    status: 'Under Review',
    lecturer: 'J. Roberts',
    feedback: '',
    strengths: '',
    improvements: '',
    reviewedDate: '',
  },
  {
    id: 'database-queries',
    title: 'Database Query Results',
    subject: 'Database Systems',
    submissionDate: '01 Oct 2026',
    mark: '74 / 100',
    status: 'Graded',
    lecturer: 'Prof. Daniel Perera',
    feedback: 'Good use of indexes and clear comparison of query performance across the test cases.',
    strengths: 'Your query structure is efficient and the results table makes the performance differences easy to follow.',
    improvements: 'Explain the trade-offs of each indexing choice in more detail in the discussion section.',
    reviewedDate: '04 Oct 2026',
  },
  {
    id: 'programming-reflection',
    title: 'Programming Lab Reflection',
    subject: 'Software Engineering',
    submissionDate: 'Not submitted',
    mark: '—',
    status: 'Not Submitted',
    lecturer: 'Dr. Meera Shah',
    feedback: '',
    strengths: '',
    improvements: '',
    reviewedDate: '',
  },
]

function StatusBadge({ status }) {
  return <span className={`marks-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function MarksFeedbackPage() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(marksRecords[0].id)
  const visibleRecords = marksRecords.filter((record) => filter === 'All' || record.status === filter)
  const selectedRecord = visibleRecords.find((record) => record.id === selectedId) || visibleRecords[0]
  const gradedRecords = marksRecords.filter((record) => record.status === 'Graded')
  const overallAverage = Math.round(gradedRecords.reduce((total, record) => total + Number.parseInt(record.mark, 10), 0) / gradedRecords.length)

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
          <section className="marks-summary" aria-label="Marks summary">
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon green-icon">%</span><span className="card-label">Overall average mark</span></div><p className="large-stat">{overallAverage}<span>%</span></p><p className="summary-meta">Across graded assignments</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon blue-icon">✓</span><span className="card-label">Assignments graded</span></div><p className="large-stat">{gradedRecords.length}</p><p className="summary-meta">Feedback is available to review</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon gold-icon">◷</span><span className="card-label">Awaiting review</span></div><p className="large-stat">{marksRecords.filter((record) => record.status === 'Under Review').length}</p><p className="summary-meta">Lecturer feedback is pending</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon rose-icon">↗</span><span className="card-label">Most recent feedback</span></div><p className="marks-date-stat">06 Oct</p><p className="summary-meta">HCI Observation Report</p></article>
          </section>

          <div className="assignment-toolbar marks-toolbar">
            <div><p className="eyebrow">Assessment progress</p><h2>Your laboratory work</h2></div>
            <div className="assignment-filters" aria-label="Marks and feedback filters">
              {filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>

          <div className="marks-layout">
            <section className="marks-table-wrap" aria-label={`${filter} marks and feedback`}>
              {visibleRecords.length === 0 ? <div className="empty-state marks-empty"><strong>No marks or feedback</strong><p>There are no assignments matching this filter yet.</p></div> : (
                <div className="marks-table-scroll">
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
                </div>
              )}
            </section>

            {selectedRecord && <aside className="marks-detail-panel">
              <div className="section-heading"><div><p className="eyebrow">Feedback details</p><h2>{selectedRecord.title}</h2></div><StatusBadge status={selectedRecord.status} /></div>
              <div className="marks-detail-meta"><span><strong>Subject</strong>{selectedRecord.subject}</span><span><strong>Submission date</strong>{selectedRecord.submissionDate}</span><span><strong>Mark</strong>{selectedRecord.mark}</span><span><strong>Lecturer</strong>{selectedRecord.lecturer}</span></div>
              {selectedRecord.status === 'Graded' ? <>
                <div className="detail-block"><h4>Feedback comments</h4><p>{selectedRecord.feedback}</p></div>
                <div className="detail-block"><h4>Strengths</h4><p>{selectedRecord.strengths}</p></div>
                <div className="detail-block"><h4>Suggested improvements</h4><p>{selectedRecord.improvements}</p></div>
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

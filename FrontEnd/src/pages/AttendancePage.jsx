import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'

const filters = ['All', 'Present', 'Absent', 'Late', 'Excused', 'Upcoming']

const attendanceRecords = [
  { id: 1, title: 'Human Computer Interaction', date: 'Tue, 24 Sep 2026', room: 'Lab 3A', lecturer: 'Dr. Amina Malik', status: 'Present', tone: 'green', note: 'You attended this session.' },
  { id: 2, title: 'Database Systems', date: 'Thu, 26 Sep 2026', room: 'Lab 2B', lecturer: 'Prof. Daniel Perera', status: 'Late', tone: 'gold', note: 'You arrived 12 minutes after the session started.' },
  { id: 3, title: 'Network Design', date: 'Sat, 28 Sep 2026', room: 'Network Lab', lecturer: 'J. Roberts', status: 'Absent', tone: 'rose', note: 'No attendance was recorded for this session.' },
  { id: 4, title: 'Software Engineering', date: 'Mon, 30 Sep 2026', room: 'Lab 1C', lecturer: 'Dr. Meera Shah', status: 'Excused', tone: 'blue', note: 'Your absence was approved by the department.' },
  { id: 5, title: 'Human Computer Interaction', date: 'Tue, 01 Oct 2026', room: 'Lab 3A', lecturer: 'Dr. Amina Malik', status: 'Upcoming', tone: 'green', note: 'Attendance will be recorded after the session.' },
  { id: 6, title: 'Database Systems', date: 'Mon, 07 Oct 2026', room: 'Lab 2B', lecturer: 'Prof. Daniel Perera', status: 'Upcoming', tone: 'blue', note: 'Attendance will be recorded after the session.' },
]

function AttendancePage() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(attendanceRecords[0].id)
  const visibleRecords = attendanceRecords.filter((record) => filter === 'All' || record.status === filter)
  const selectedRecord = visibleRecords.find((record) => record.id === selectedId) || visibleRecords[0]

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main attendance-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Student workspace</p><h1>Attendance</h1><p className="student-header-copy">Track your lab attendance and keep up with upcoming sessions.</p></div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content attendance-content">
          <section className="attendance-summary" aria-label="Attendance summary">
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon green-icon">✓</span><span className="card-label">Overall attendance</span></div><p className="large-stat">86<span>%</span></p><p className="summary-meta">Across completed lab sessions</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon blue-icon">◷</span><span className="card-label">Sessions attended</span></div><p className="large-stat">4</p><p className="summary-meta">Present, late, or excused</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon rose-icon">!</span><span className="card-label">Sessions missed</span></div><p className="large-stat">1</p><p className="summary-meta">One absence needs attention</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon gold-icon">→</span><span className="card-label">Upcoming sessions</span></div><p className="large-stat">2</p><p className="summary-meta">Next session on 01 Oct</p></article>
          </section>

          <div className="attendance-toolbar">
            <div><p className="eyebrow">Attendance history</p><h2>Lab sessions</h2></div>
            <div className="assignment-filters" aria-label="Attendance filters">
              {filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>

          <div className="attendance-layout">
            <section className="attendance-table-wrap" aria-label={`${filter} attendance records`}>
              {visibleRecords.length === 0 ? <div className="empty-state attendance-empty"><strong>No attendance records</strong><p>There are no sessions matching this filter yet.</p></div> : <div className="attendance-table-scroll"><table className="attendance-table"><thead><tr><th>Lab session</th><th>Date</th><th>Room</th><th>Lecturer</th><th>Status</th></tr></thead><tbody>{visibleRecords.map((record) => <tr className={selectedRecord?.id === record.id ? 'selected' : ''} key={record.id} onClick={() => setSelectedId(record.id)}><td><strong>{record.title}</strong></td><td>{record.date}</td><td>{record.room}</td><td>{record.lecturer}</td><td><span className={`attendance-status ${record.status.toLowerCase()}`}>{record.status}</span></td></tr>)}</tbody></table></div>}
            </section>

            {selectedRecord && <aside className="attendance-detail-card"><div className="details-heading"><div><p className="eyebrow">Selected session</p><h2>Attendance details</h2></div><span className={`attendance-status ${selectedRecord.status.toLowerCase()}`}>{selectedRecord.status}</span></div><h3>{selectedRecord.title}</h3><p className="details-meta">{selectedRecord.date}<br />{selectedRecord.room}<br />Lecturer: {selectedRecord.lecturer}</p><div className="detail-block"><h4>Status note</h4><p>{selectedRecord.note}</p></div>{selectedRecord.status === 'Absent' && <div className="medical-request-note"><h4>Need to explain this absence?</h4><p>You can submit a medical request for this missed session.</p><Link className="section-link" to="/student/medical-requests">Submit medical request <span aria-hidden="true">→</span></Link></div>}</aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default AttendancePage

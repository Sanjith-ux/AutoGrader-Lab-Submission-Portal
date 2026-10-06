import { useNavigate } from 'react-router-dom'
import LecturerSidebar from '../components/LecturerSidebar'

function DashboardPage() {
  const navigate = useNavigate()
  const upcomingLabs = [
    { name: 'Human Computer Interaction', date: 'Tue, 08 Oct 2026', time: '09:00 - 11:00', room: 'Lab 3A', students: 28 },
    { name: 'Database Systems', date: 'Thu, 10 Oct 2026', time: '14:00 - 16:00', room: 'Lab 2B', students: 24 },
    { name: 'Network Design', date: 'Mon, 14 Oct 2026', time: '10:00 - 12:00', room: 'Network Lab', students: 21 },
  ]
  const submissions = [
    { student: 'Sofia Perera', assignment: 'HCI Observation Report', status: 'Submitted', time: 'Today · 09:42' },
    { student: 'Noah Williams', assignment: 'Database Query Results', status: 'Under Review', time: 'Yesterday · 16:18' },
    { student: 'Amara Silva', assignment: 'Network Topology Design', status: 'Submitted', time: 'Yesterday · 11:05' },
  ]
  const medicalRequests = [
    { student: 'Liam Fernando', lab: 'Database Systems · 26 Sep', date: '02 Oct 2026' },
    { student: 'Maya Chen', lab: 'Network Design · 28 Sep', date: '01 Oct 2026' },
  ]

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header lecturer-header">
          <div>
            <p className="eyebrow">Lecturer Workspace</p>
            <h1>Welcome back, Dr. Fernando</h1>
            <p className="student-header-copy">Here is what is happening across your laboratory teaching this week.</p>
          </div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content">
          <section className="summary-grid lecturer-summary" aria-label="Lecturer summary">
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon green-icon">◷</span><span className="card-label">Upcoming lab sessions</span></div><p className="large-stat">3</p><p className="summary-meta">Across the next seven days</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon blue-icon">□</span><span className="card-label">Active assignments</span></div><p className="large-stat">6</p><p className="summary-meta">Currently open for students</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon gold-icon">↑</span><span className="card-label">Awaiting review</span></div><p className="large-stat">12</p><p className="summary-meta">Submissions need your attention</p></article>
            <article className="summary-card"><div className="summary-card-top"><span className="card-icon rose-icon">+</span><span className="card-label">Pending medical requests</span></div><p className="large-stat">2</p><p className="summary-meta">Requests awaiting a decision</p></article>
          </section>

          <section className="lecturer-quick-actions" aria-label="Quick actions">
            <div><p className="eyebrow">Common tasks</p><h2>Quick actions</h2></div>
            <div className="quick-action-list"><button className="quick-action-button" type="button" onClick={() => navigate('/lecturer/assignments/create')}>Create Assignment <span aria-hidden="true">+</span></button><button className="quick-action-button" type="button" onClick={() => navigate('/lecturer/attendance')}>Record Attendance <span aria-hidden="true">✓</span></button><button className="quick-action-button" type="button" onClick={() => navigate('/lecturer/medical-requests')}>Review Medical Requests <span aria-hidden="true">→</span></button></div>
          </section>

          <div className="lecturer-columns">
            <section className="dashboard-section lecturer-panel">
              <div className="section-heading"><div><p className="eyebrow">This week</p><h2>Upcoming Lab Sessions</h2></div><button className="section-link" type="button">View schedule <span aria-hidden="true">→</span></button></div>
              <div className="lecturer-table-scroll"><table className="lecturer-table"><thead><tr><th>Lab name</th><th>Date &amp; time</th><th>Room</th><th>Students</th></tr></thead><tbody>{upcomingLabs.map((lab) => <tr key={lab.name}><td><strong>{lab.name}</strong></td><td>{lab.date}<small>{lab.time}</small></td><td>{lab.room}</td><td>{lab.students}</td></tr>)}</tbody></table></div>
            </section>

            <section className="dashboard-section lecturer-panel">
              <div className="section-heading"><div><p className="eyebrow">Latest updates</p><h2>Recent Submission Activity</h2></div><button className="section-link" type="button">See all <span aria-hidden="true">→</span></button></div>
              <div className="lecturer-activity-list">{submissions.map((submission) => <article className="lecturer-activity-item" key={`${submission.student}-${submission.assignment}`}><div><h3>{submission.student}</h3><p>{submission.assignment}</p></div><div><span className={`lecturer-status ${submission.status.toLowerCase().replaceAll(' ', '-')}`}>{submission.status}</span><time>{submission.time}</time></div></article>)}</div>
            </section>
          </div>

          <section className="dashboard-section lecturer-panel medical-panel">
            <div className="section-heading"><div><p className="eyebrow">Needs attention</p><h2>Pending Medical Requests</h2></div><button className="section-link" type="button">Review requests <span aria-hidden="true">→</span></button></div>
            <div className="medical-request-list">{medicalRequests.map((request) => <article className="medical-request-item" key={request.student}><div className="feedback-avatar">{request.student.split(' ').map((name) => name[0]).join('')}</div><div><h3>{request.student}</h3><p>{request.lab}</p></div><time>{request.date}</time><span className="lecturer-status pending">Pending</span></article>)}</div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
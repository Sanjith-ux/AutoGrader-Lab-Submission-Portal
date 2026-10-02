import StudentSidebar from '../components/StudentSidebar'

const activities = [
  { type: 'lab', title: 'Human Computer Interaction', detail: 'Physical lab · Lab 3A', time: 'Tomorrow · 09:00 - 11:00', tone: 'green' },
  { type: 'assignment', title: 'Network Design Report', detail: 'Assignment deadline', time: 'Friday, 04 Oct · 23:59', tone: 'gold' },
  { type: 'lab', title: 'Database Systems', detail: 'Physical lab · Lab 2B', time: 'Mon, 07 Oct · 14:00 - 16:00', tone: 'blue' },
]

function StudentDashboard() {
  return (
    <main className="student-dashboard">
      <StudentSidebar />

      <section className="student-main">
        <header className="student-header">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Welcome back, Student</h1>
            <p className="student-header-copy">Here is what is happening across your labs this week.</p>
          </div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content">
          <section className="summary-grid" aria-label="Student summary">
            <article className="summary-card summary-card-wide">
              <div className="summary-card-top"><span className="card-icon green-icon">◷</span><span className="card-label">Next physical lab</span></div>
              <h2>Human Computer Interaction</h2>
              <p className="summary-value">Tomorrow, 09:00 - 11:00</p>
              <p className="summary-meta">Lab 3A · Engineering Building</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="card-icon gold-icon">!</span><span className="card-label">Upcoming deadlines</span></div>
              <p className="large-stat">2</p>
              <p className="summary-meta">Assignments due this week</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="card-icon blue-icon">✓</span><span className="card-label">Attendance</span></div>
              <p className="large-stat">92<span>%</span></p>
              <p className="summary-meta">+4% from last month</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="card-icon rose-icon">+</span><span className="card-label">Medical requests</span></div>
              <p className="large-stat">1</p>
              <p className="summary-meta">Awaiting lecturer review</p>
            </article>
          </section>

          <div className="dashboard-columns">
            <section className="dashboard-section activity-section">
              <div className="section-heading"><div><p className="eyebrow">Your week</p><h2>Upcoming activity</h2></div><button className="section-link" type="button">View calendar <span aria-hidden="true">→</span></button></div>
              <div className="activity-list">
                {activities.map((activity) => (
                  <article className="activity-item" key={activity.title}>
                    <span className={`activity-marker ${activity.tone}`} aria-hidden="true">{activity.type === 'lab' ? '◷' : '□'}</span>
                    <div className="activity-details"><h3>{activity.title}</h3><p>{activity.detail}</p></div>
                    <time>{activity.time}</time>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section feedback-section">
              <div className="section-heading"><div><p className="eyebrow">Keep growing</p><h2>Recent feedback</h2></div><button className="section-link" type="button">See all <span aria-hidden="true">→</span></button></div>
              <article className="feedback-item"><div className="feedback-avatar">AM</div><div><h3>Dr. Amina Malik <span>· Database Systems</span></h3><p>“Your query structure is clear and the explanation of indexing is strong. Add one more example to make the trade-off easier to follow.”</p><time>2 days ago</time></div></article>
              <article className="feedback-item"><div className="feedback-avatar peach">JR</div><div><h3>J. Roberts <span>· HCI Lab</span></h3><p>“Good observation notes. The next step is to connect your findings to the user journey map.”</p><time>Last week</time></div></article>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default StudentDashboard
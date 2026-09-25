import { Link, useLocation } from 'react-router-dom'

function DashboardPage() {
  const isStudent = useLocation().pathname === '/student-dashboard'
  const role = isStudent ? 'Student' : 'Lecturer'

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand"><div className="brand-mark"><span>LT</span></div><strong>LabTrack</strong></div>
          <span className="role-badge">{role} portal</span>
        </header>
        <section className="dashboard-content">
          <p className="eyebrow">{role} workspace</p>
          <h1>Welcome to your dashboard.</h1>
          <p>This is the starting point for your {role.toLowerCase()} lab experience. Your portal features will appear here soon.</p>
          <Link className="back-link" to="/">← Return to sign in</Link>
        </section>
      </div>
    </main>
  )
}

export default DashboardPage
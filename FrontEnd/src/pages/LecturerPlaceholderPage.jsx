import { Link, useNavigate } from 'react-router-dom'
import LecturerSidebar from '../components/LecturerSidebar'

function LecturerPlaceholderPage() {
  const navigate = useNavigate()

  return (
    <main className="student-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Lecturer tools are coming soon.</h1><p className="student-header-copy">This area will be available when the lecturer workflows are connected.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>
        <div className="student-content"><button className="section-link" type="button" onClick={() => navigate('/lecturer-dashboard')}>← Return to dashboard</button><Link className="back-link" to="/">Log out</Link></div>
      </section>
    </main>
  )
}

export default LecturerPlaceholderPage

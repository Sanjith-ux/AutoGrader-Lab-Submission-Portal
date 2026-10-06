import { NavLink, useNavigate } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', icon: '⌂', path: '/lecturer-dashboard', end: true },
  { label: 'Lab Schedule', icon: '▦', path: '/lecturer/schedule' },
  { label: 'Assignments', icon: '□', path: '/lecturer/assignments' },
  { label: 'Student Submissions', icon: '↑', path: '/lecturer/submissions' },
  { label: 'Attendance', icon: '✓', path: '/lecturer/attendance' },
  { label: 'Medical Requests', icon: '+', path: '/lecturer/medical-requests' },
  { label: 'Marks & Feedback', icon: '↗', path: '/lecturer/marks-feedback' },
]

function LecturerSidebar() {
  const navigate = useNavigate()

  return (
    <aside className="student-sidebar lecturer-sidebar">
      <div className="sidebar-brand"><div className="brand-mark"><span>LT</span></div><strong>LabTrack</strong></div>
      <div className="sidebar-section-label">Lecturer Workspace</div>
      <nav className="sidebar-nav" aria-label="Lecturer navigation">
        {navigationItems.map((item) => <NavLink className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} to={item.path} end={item.end} key={item.label}><span className="sidebar-icon" aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}
      </nav>
      <button className="logout-button" type="button" onClick={() => navigate('/')}>
        <span className="sidebar-icon" aria-hidden="true">↪</span>
        Log out
      </button>
    </aside>
  )
}

export default LecturerSidebar

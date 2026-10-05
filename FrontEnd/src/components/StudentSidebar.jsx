import { NavLink, useNavigate } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', icon: '⌂', path: '/student-dashboard' },
  { label: 'Lab Schedule', icon: '▦', path: '/student/schedule' },
  { label: 'Assignments', icon: '□', path: '/student/assignments' },
  { label: 'My Submissions', icon: '↑', path: '/student/submissions' },
  { label: 'Attendance', icon: '✓', path: '/student/attendance' },
  { label: 'Medical Requests', icon: '+', path: '/student/medical-requests' },
  { label: 'Marks & Feedback', icon: '↗', path: '/student/marks-feedback' },
]

function StudentSidebar() {
  const navigate = useNavigate()

  return (
    <aside className="student-sidebar">
      <div className="sidebar-brand"><div className="brand-mark"><span>LT</span></div><strong>LabTrack</strong></div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Student navigation">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            to={item.path}
            key={item.label}
            end={item.label === 'Dashboard' || item.label === 'Lab Schedule'}
          >
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button className="logout-button" type="button" onClick={() => navigate('/')}>
        <span className="sidebar-icon" aria-hidden="true">↪</span>
        Log out
      </button>
    </aside>
  )
}

export default StudentSidebar
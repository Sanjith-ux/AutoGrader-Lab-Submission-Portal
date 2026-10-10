import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth.js'

function ProtectedRoute({ role }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <main className="auth-loading">Restoring your LabTrack session…</main>
  if (!user) return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/lecturer-dashboard'} replace />
  return <Outlet />
}

export default ProtectedRoute

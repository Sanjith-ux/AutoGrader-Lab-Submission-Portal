import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StudentDashboard from './pages/StudentDashboard'
import LabSchedulePage from './pages/LabSchedulePage'
import AssignmentsPage from './pages/AssignmentsPage'
import AssignmentDetailsPage from './pages/AssignmentDetailsPage'
import SubmissionsPage from './pages/SubmissionsPage'
import AttendancePage from './pages/AttendancePage'
import MedicalRequestsPage from './pages/MedicalRequestsPage'
import MarksFeedbackPage from './pages/MarksFeedbackPage'
import LecturerPlaceholderPage from './pages/LecturerPlaceholderPage'
import LecturerAssignmentsPage from './pages/LecturerAssignmentsPage'
import LecturerAssignmentFormPage from './pages/LecturerAssignmentFormPage'
import LecturerSchedulePage from './pages/LecturerSchedulePage'
import LecturerSubmissionsPage from './pages/LecturerSubmissionsPage'
import LecturerAttendancePage from './pages/LecturerAttendancePage'
import LecturerMedicalRequestsPage from './pages/LecturerMedicalRequestsPage'
import LecturerMarksFeedbackPage from './pages/LecturerMarksFeedbackPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-dashboard/*" element={<StudentDashboard />} />
            <Route path="/student/schedule" element={<LabSchedulePage />} />
            <Route path="/student/assignments" element={<AssignmentsPage />} />
            <Route path="/student/assignments/:assignmentId" element={<AssignmentDetailsPage />} />
            <Route path="/student/submissions" element={<SubmissionsPage />} />
            <Route path="/student/attendance" element={<AttendancePage />} />
            <Route path="/student/medical-requests" element={<MedicalRequestsPage />} />
            <Route path="/student/marks-feedback" element={<MarksFeedbackPage />} />
          </Route>
          <Route element={<ProtectedRoute role="lecturer" />}>
            <Route path="/lecturer-dashboard" element={<DashboardPage />} />
            <Route path="/lecturer/schedule" element={<LecturerSchedulePage />} />
            <Route path="/lecturer/submissions" element={<LecturerSubmissionsPage />} />
            <Route path="/lecturer/attendance" element={<LecturerAttendancePage />} />
            <Route path="/lecturer/medical-requests" element={<LecturerMedicalRequestsPage />} />
            <Route path="/lecturer/marks-feedback" element={<LecturerMarksFeedbackPage />} />
            <Route path="/lecturer/assignments" element={<LecturerAssignmentsPage />} />
            <Route path="/lecturer/assignments/create" element={<LecturerAssignmentFormPage />} />
            <Route path="/lecturer/assignments/:assignmentId/edit" element={<LecturerAssignmentFormPage edit />} />
            <Route path="/lecturer/*" element={<LecturerPlaceholderPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

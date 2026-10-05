import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentDashboard from './pages/StudentDashboard'
import LabSchedulePage from './pages/LabSchedulePage'
import AssignmentsPage from './pages/AssignmentsPage'
import AssignmentDetailsPage from './pages/AssignmentDetailsPage'
import SubmissionsPage from './pages/SubmissionsPage'
import AttendancePage from './pages/AttendancePage'
import MedicalRequestsPage from './pages/MedicalRequestsPage'
import MarksFeedbackPage from './pages/MarksFeedbackPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
        <Route path="/student/schedule" element={<LabSchedulePage />} />
        <Route path="/student/assignments" element={<AssignmentsPage />} />
        <Route path="/student/assignments/:assignmentId" element={<AssignmentDetailsPage />} />
        <Route path="/student/submissions" element={<SubmissionsPage />} />
        <Route path="/student/attendance" element={<AttendancePage />} />
        <Route path="/student/medical-requests" element={<MedicalRequestsPage />} />
        <Route path="/student/marks-feedback" element={<MarksFeedbackPage />} />
        <Route path="/lecturer-dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

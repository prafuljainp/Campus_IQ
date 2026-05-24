import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './context/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentProfilePage from './pages/StudentProfilePage'
import FacultyPage from './pages/FacultyPage'
import DepartmentsPage from './pages/DepartmentsPage'
import PlacementsPage from './pages/PlacementsPage'
import AttendancePage from './pages/AttendancePage'
import { MarksPage } from './pages/MarksPage'
import { NoticesPage } from './pages/NoticesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import StudentSuccessPage from './pages/StudentSuccessPage'
import AptitudePage from './pages/AptitudePage'
import { ActivityLogsPage } from './pages/NoticesPage'
import { RankingPage } from './pages/NoticesPage'
// Phase 3 Pages
import JobPortalPage from './pages/JobPortalPage'
import NotificationsPage from './pages/NotificationsPage'
// Phase 4 Pages
import AlumniPage from './pages/AlumniPage'
// Phase 5 Pages
import EnterprisePage from './pages/EnterprisePage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentProfilePage />} />
        <Route path="faculty" element={<FacultyPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="placements" element={<PlacementsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="student-success" element={<StudentSuccessPage />} />
        <Route path="training" element={<AptitudePage />} />
        <Route path="aptitude" element={<AptitudePage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="logs" element={<ActivityLogsPage />} />
        
        {/* Phase 3 - Integration */}
        <Route path="job-portal" element={<JobPortalPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Phase 4 - Engagement */}
        <Route path="alumni" element={<AlumniPage />} />
        
        {/* Phase 5 - Enterprise */}
        <Route path="enterprise" element={<EnterprisePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

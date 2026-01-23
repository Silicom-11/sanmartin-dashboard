import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from '@/layouts/MainLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/StudentsPage'
import TeachersPage from '@/pages/TeachersPage'
import ParentsPage from '@/pages/ParentsPage'
import CoursesPage from '@/pages/CoursesPage'
import GradesPage from '@/pages/GradesPage'
import AttendancePage from '@/pages/AttendancePage'
import JustificationsPage from '@/pages/JustificationsPage'
import CalendarPage from '@/pages/CalendarPage'
import MessagesPage from '@/pages/MessagesPage'
import GPSTrackingPage from '@/pages/GPSTrackingPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="justifications" element={<JustificationsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="gps-tracking" element={<GPSTrackingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App

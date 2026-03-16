import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import TimesheetPage from './pages/TimesheetPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ReportsPage from './pages/ReportsPage';
import LeavePage from './pages/LeavePage';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import LeaveCalendarPage from './pages/LeaveCalendarPage';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/HelpPage';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/oauth/success" element={<OAuthCallbackPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timesheet"
        element={
          <ProtectedRoute>
            <Layout>
              <TimesheetPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <Layout>
              <ApprovalsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <Layout>
              <ReportsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Layout>
              <LeavePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave/approvals"
        element={
          <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <Layout>
              <LeaveApprovalsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave/calendar"
        element={
          <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
            <Layout>
              <LeaveCalendarPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Layout>
              <HelpPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

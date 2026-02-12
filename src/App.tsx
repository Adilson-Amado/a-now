import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ConfigCheck } from '@/components/ConfigCheck';
import { DesktopNotificationContainer } from '@/components/Notifications/DesktopNotificationContainer';
import { PWAInstallBanner } from '@/components/Notifications/PWAInstallBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTaskMonitoring } from '@/hooks/useTaskMonitoring';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';

// Componente para monitoramento de tarefas
function TaskMonitor() {
  useTaskMonitoring();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ConfigCheck />
          <DesktopNotificationContainer />
          <PWAInstallBanner />
          <TaskMonitor />
          <Toaster position="top-right" expand={false} richColors closeButton />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

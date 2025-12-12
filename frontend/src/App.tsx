import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { BatchesPage } from './pages/BatchesPage';
import { BatchDetailPage } from './pages/BatchDetailPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { MigrationPage } from './pages/MigrationPage';
import { CalendarPage } from './pages/CalendarPage';
import { MainLayout } from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';
import { getCurrentUser } from './services/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth initializer
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated) {
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch {
          setUser(null);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="trainings" element={<TrainingsPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="batches/:id" element={<BatchDetailPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="migration" element={<MigrationPage />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" description="System settings" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Placeholder component for settings
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">⚙️</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default App;

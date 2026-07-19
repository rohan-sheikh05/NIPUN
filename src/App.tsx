import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { JobsBrowse } from './pages/jobs/JobsBrowse';
import { JobDetail } from './pages/jobs/JobDetail';
import { PostJob } from './pages/jobs/PostJob';
import { ContractDetail } from './pages/contracts/ContractDetail';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/jobs" element={<JobsBrowse />} />
            <Route path="/jobs/:id" element={<JobDetail />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRouteForOnboarding>
                  <Onboarding />
                </ProtectedRouteForOnboarding>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-job"
              element={
                <ProtectedRoute requireRole="client">
                  <PostJob />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Onboarding is reachable once signed in, even before a profile row exists —
// ProtectedRoute's normal behavior would redirect *to* /onboarding in that
// case, so it can't wrap this route the same way. This just requires a
// session and nothing else.
function ProtectedRouteForOnboarding({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

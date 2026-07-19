import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/database';

export function ProtectedRoute({ children, requireRole }: { children: ReactNode; requireRole?: UserRole }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="py-24 text-center text-line-500 font-mono text-sm">Loading…</div>;
  }

  if (!session) return <Navigate to="/login" replace />;

  // Signed in but hasn't finished onboarding (no profile row yet)
  if (!profile) return <Navigate to="/onboarding" replace />;

  if (requireRole && profile.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

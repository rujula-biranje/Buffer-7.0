import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

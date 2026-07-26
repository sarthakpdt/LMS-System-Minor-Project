import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router';

interface ProtectedTeacherRouteProps {
  children: ReactNode;
}

export function ProtectedTeacherRoute({ children }: ProtectedTeacherRouteProps) {
  const { user, loading } = useAuth();

  // Show spinner while auth is initializing to avoid flicker
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Check localStorage as backup in case state hasn't updated yet
  const storedUser = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem("lms_user") || 'null')
    : null;
  const currentUser = user || storedUser;

  // Not authenticated or wrong role → go to /auth
  if (!currentUser || currentUser?.role !== 'teacher') {
    return <Navigate to="/auth" state={{ role: 'teacher' }} replace />;
  }

  return <>{children}</>;
}

import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedTeacherRouteProps {
  children: ReactNode;
}

export function ProtectedTeacherRoute({ children }: ProtectedTeacherRouteProps) {
  const { user } = useAuth();

  // Check if user is authenticated and has teacher role
  // Also check localStorage as backup in case state hasn't updated yet
  const storedUser = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem("lms_user") || 'null') : null;
  const currentUser = user || storedUser;

  if (!currentUser || currentUser?.role !== 'teacher') {
    return <Navigate to="/auth" state={{ role: 'teacher' }} replace />;
  }

  return <>{children}</>;
}

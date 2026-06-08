import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Check if user is in state OR in localStorage (for timing issues after login)
  const isAuthenticated = user || (typeof localStorage !== 'undefined' && !!localStorage.getItem("lms_user"));

  // 1. Show a loading state if the AuthContext is still checking for a token
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. If not logged in, redirect to the /auth page
  // We save the current location so we can redirect them back after they log in
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. If logged in, render the protected content (the Layout and Dashboard)
  return <>{children}</>;
}
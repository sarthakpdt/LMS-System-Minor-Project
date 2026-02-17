import { useAuth } from '../../contexts/AuthContext';
import { StudentAuth } from './StudentAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <StudentAuth />;
  }

  return <>{children}</>;
}

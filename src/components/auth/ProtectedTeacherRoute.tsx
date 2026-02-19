import { useAuth } from '../../contexts/AuthContext';
import { TeacherAuth } from './TeacherAuth';

interface ProtectedTeacherRouteProps {
  children: React.ReactNode;
}

export function ProtectedTeacherRoute({ children }: ProtectedTeacherRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || user?.role !== 'teacher') {
    return <TeacherAuth />;
  }

  return <>{children}</>;
}

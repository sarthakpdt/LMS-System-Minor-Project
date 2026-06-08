import { useAuth } from '../../contexts/AuthContext';
import NotificationsPanel from './NotificationsPanel';

export function TeacherNotifications() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600">Create and view notifications for your students, teachers, or admins.</p>
      </div>

      <div className="bg-red rounded-2xl border border-gray-200 shadow-sm p-6">
        {user ? (
          <NotificationsPanel
            userId={user.id}
            role={user.role}
            userName={user.name}
            isAdmin={user.role === 'admin'}
          />
        ) : (
          <div className="text-sm text-gray-500">Loading notifications...</div>
        )}
      </div>
    </div>
  );
}

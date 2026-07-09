import { useAuth } from '../../contexts/AuthContext';
import { Bell } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';

export function TeacherNotifications() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-[1rem] flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Notifications</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">Create and view notifications for your students, teachers, or admins.</p>
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

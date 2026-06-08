import { Outlet, NavLink } from 'react-router';
import { Home, BookOpen, FolderOpen, ClipboardList, Award, Bell, LogOut, FileText, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export function StudentLayout() {
  const { user, logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: Home, label: 'My Dashboard', end: true },
    { to: '/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/quizzes', icon: ClipboardList, label: 'Quizzes & Tests' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully', {
      description: 'See you next time!',
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center shadow-md">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-white">EduTrack LMS</h1>
              <p className="text-xs text-blue-100">Student Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.department || 'Department'}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
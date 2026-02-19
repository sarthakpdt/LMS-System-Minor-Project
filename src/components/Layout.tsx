import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, GraduationCap, FolderOpen, ClipboardCheck, UserCircle, Sparkles } from 'lucide-react';

export function Layout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
    { to: '/grading', icon: Sparkles, label: 'Auto Grading' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/student-view', icon: UserCircle, label: 'Student View' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">EduTrack LMS</h1>
              <p className="text-xs text-gray-500">Performance Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
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
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
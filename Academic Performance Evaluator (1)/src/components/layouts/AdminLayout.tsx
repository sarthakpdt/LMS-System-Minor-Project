import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, Shield, FolderOpen, ClipboardCheck, Sparkles, GraduationCap } from 'lucide-react';
import { RoleSwitcher } from '../RoleSwitcher';

export function AdminLayout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
    { to: '/quizzes', icon: Shield, label: 'Quiz System' },
    { to: '/grading', icon: Sparkles, label: 'Auto Grading' },
    { to: '/performance-levels', icon: BarChart3, label: 'Performance Levels' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col">
        <div className="p-6 border-b border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">EduTrack LMS</h1>
              <p className="text-xs text-purple-200">Administrator Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/20 text-white backdrop-blur-sm shadow-lg'
                        : 'text-purple-100 hover:bg-white/10'
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

        <div className="p-4">
          <RoleSwitcher />
        </div>
        
        <div className="p-4 border-t border-purple-500">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-sm font-semibold text-white">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-purple-200">System Administrator</p>
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
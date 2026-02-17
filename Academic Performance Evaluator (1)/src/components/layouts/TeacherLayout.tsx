import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, ClipboardList, FolderOpen, Sparkles, MessageSquare, TrendingUp, GraduationCap, Bell } from 'lucide-react';
import { RoleSwitcher } from '../RoleSwitcher';

export function TeacherLayout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/students', icon: Users, label: 'My Students' },
    { to: '/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/marks', icon: GraduationCap, label: 'Subject Marks' },
    { to: '/materials', icon: FolderOpen, label: 'Materials' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/quizzes', icon: ClipboardList, label: 'Quiz Management' },
    { to: '/grading', icon: Sparkles, label: 'Auto Grading' },
    { to: '/performance-levels', icon: TrendingUp, label: 'Performance Levels' },
    { to: '/analytics', icon: BarChart3, label: 'Performance' },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: 4 },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-green-600 to-green-800 text-white flex flex-col">
        <div className="p-6 border-b border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">EduTrack LMS</h1>
              <p className="text-xs text-green-200">Teacher Portal</p>
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
                        : 'text-green-100 hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <RoleSwitcher />
        </div>
        
        <div className="p-4 border-t border-green-500">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-sm font-semibold text-white">SJ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dr. Sarah Johnson</p>
              <p className="text-xs text-green-200">Mathematics Professor</p>
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
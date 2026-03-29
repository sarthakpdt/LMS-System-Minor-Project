import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, FileText, BarChart3,
  ClipboardList, FolderOpen, Sparkles, MessageSquare,
  TrendingUp, GraduationCap, Bell, LogOut, ChevronDown, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Comm.', EE: 'Electrical Eng.',
  ME: 'Mechanical Eng.', CE: 'Civil Eng.',
  CH: 'Chemical Eng.', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
};

// ─── Subject Switcher Dropdown ────────────────────────────────────────────────
function SubjectSwitcher() {
  const { user, activeSubject, setActiveSubject } = useAuth();
  const [open, setOpen] = useState(false);
  const courses: any[] = user?.assignedCourses || [];

  if (courses.length === 0) return null;

  return (
    <div className="mx-4 mb-3 relative">
      <p className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-1.5 px-1">
        Active Subject
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-3 py-2.5 transition-all"
      >
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          {activeSubject ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{activeSubject.courseName}</p>
              <p className="text-xs text-green-200 truncate">{activeSubject.courseCode} · Sem {activeSubject.semester}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">Select Subject</p>
              <p className="text-xs text-green-200">Click to choose</p>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-green-200 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-100">
            Switch Subject
          </p>
          {courses.map((c: any) => {
            const id = String(c.courseId || c._id);
            const isActive = activeSubject && String(activeSubject.courseId) === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveSubject({
                    courseId: id,
                    courseCode: c.courseCode,
                    courseName: c.courseName,
                    semester: c.semester,
                  });
                  setOpen(false);
                  toast.success(`Switched to ${c.courseName}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${isActive ? 'bg-emerald-50' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                  <BookOpen className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{c.courseName}</p>
                  <p className="text-xs text-gray-400">{c.courseCode} · Sem {c.semester}</p>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TeacherLayout ────────────────────────────────────────────────────────────
export function TeacherLayout() {
  const { user, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully', { description: 'See you next time!' });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gradient-to-b from-green-600 to-green-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-green-500/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">EduTrack LMS</h1>
              <p className="text-xs text-green-200">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Subject Switcher */}
        <div className="pt-4">
          <SubjectSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto">
          <p className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-2 px-2">Navigation</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive ? 'bg-white/20 text-white font-semibold shadow' : 'text-green-100 hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-green-500/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TC'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Teacher'}</p>
              <p className="text-xs text-green-200 truncate">{DEPT_LABELS[user?.department || ''] || user?.department || 'Department'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-green-100 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
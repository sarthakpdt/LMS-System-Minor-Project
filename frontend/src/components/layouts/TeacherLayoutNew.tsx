import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, FileText, BarChart3,
  ClipboardList, FolderOpen, Sparkles, MessageSquare,
  TrendingUp, GraduationCap, Bell, LogOut, ChevronDown, Check,
  Menu, X, Moon, Sun, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { motion } from 'framer-motion';
import { Button, Card } from '../../theme/components';
import { animationVariants, StaggerList, StaggerItem, PageTransition, SpinningLoader } from '../../theme/animations';

const DEPT_LABELS: Record<string, string> = {
  CS: 'Computer Science', IT: 'Information Technology',
  ECE: 'Electronics & Comm.', EE: 'Electrical Eng.',
  ME: 'Mechanical Eng.', CE: 'Civil Eng.',
  CH: 'Chemical Eng.', BT: 'Biotechnology',
  MBA: 'MBA', MCA: 'MCA',
};

// Subject Switcher Dropdown
function SubjectSwitcher() {
  const { user, activeSubject, setActiveSubject } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const courses: any[] = user?.assignedCourses || [];

  if (courses.length === 0) return null;

  return (
    <div className="mx-4 mb-3 relative">
      <p className="text-xs font-semibold text-green-200 dark:text-green-300 uppercase tracking-wider mb-1.5 px-1">
        Active Subject
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-3 py-2.5 transition-all"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-md">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          {activeSubject ? (
            <>
              <p className="text-sm font-semibold text-white truncate">{activeSubject.courseName}</p>
              <p className="text-xs text-green-100 truncate">{activeSubject.courseCode} · Sem {activeSubject.semester}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">Select Subject</p>
              <p className="text-xs text-green-100">Click to choose</p>
            </>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4 text-green-100 flex-shrink-0" />
        </motion.div>
      </motion.button>

      {open && (
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
        >
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            Switch Subject
          </p>
          {courses.map((c: any) => {
            const id = String(c.courseId || c._id);
            const isActive = activeSubject && String(activeSubject.courseId) === id;
            return (
              <motion.button
                key={id}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
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
                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                  isActive ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {isActive ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-gray-300'}`}>
                    {c.courseName}
                  </p>
                  <p className={`text-xs truncate ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {c.courseCode} · Sem {c.semester}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// Main Teacher Layout
export function TeacherLayoutNew() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/materials', icon: FolderOpen, label: 'Materials' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/assessments', icon: ClipboardList, label: 'Quizzes' },
    { to: '/quiz-management', icon: Sparkles, label: 'Quiz Creator' },
    { to: '/quiz-monitor', icon: TrendingUp, label: 'Quiz Monitor' },
    { to: '/subject-marks', icon: BarChart3, label: 'Marks Entry' },
    { to: '/faculty-insights', icon: BarChart3, label: 'Faculty Insights' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-gradient-to-b from-green-600 to-green-800 dark:from-green-900 dark:to-green-950 text-white flex flex-col overflow-hidden shadow-xl"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 border-b border-green-500 dark:border-green-700"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center backdrop-blur-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-white text-lg">EduTrack</h1>
              <p className="text-xs text-green-200">Faculty Portal</p>
            </div>
          </div>
        </motion.div>

        {/* Subject Switcher */}
        {sidebarOpen && <SubjectSwitcher />}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, idx) => (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white backdrop-blur-sm shadow-lg'
                        : 'text-green-100 hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                </NavLink>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Bottom Actions */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 space-y-4 border-t border-green-500 dark:border-green-700"
          >
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark</span>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </motion.button>
          </motion.div>
        )}

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 border-t border-green-500 dark:border-green-700"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">{user?.name?.charAt(0) || 'T'}</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-white">{user?.name || 'Teacher'}</p>
                <p className="text-xs text-green-200">Faculty Member</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Faculty Dashboard</h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer"
            >
              <span className="text-sm font-semibold text-white">{user?.name?.charAt(0) || 'T'}</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[0] flex items-center justify-center">
            <img
              src="/illustrations/teacher-hero.png"
              alt="Teacher background illustration"
              className="w-full max-w-[750px] h-auto opacity-[0.05] dark:opacity-[0.02] object-contain select-none filter saturate-[0.3]"
              draggable={false}
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-[1]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

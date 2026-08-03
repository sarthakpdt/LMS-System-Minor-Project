import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';

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
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-2">
        Active Subject
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 bg-white hover:bg-slate-50 border border-gray-200 hover:border-emerald-200 rounded-xl px-3 py-2.5 transition-all dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-sm dark:hover:shadow-2xl hover:-translate-y-0.5 duration-300"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          {activeSubject ? (
            <>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{activeSubject.courseName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activeSubject.courseCode} · Sem {activeSubject.semester}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Select Subject</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click to choose</p>
            </>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </motion.div>
      </motion.button>

      {open && (
        <motion.div
          variants={animationVariants.slideInUp}
          initial="initial"
          animate="animate"
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
      ]
    },
    {
      label: 'ACADEMICS',
      items: [
        { to: '/courses', icon: BookOpen, label: 'Courses' },
        { to: '/materials', icon: FolderOpen, label: 'Materials' },
        { to: '/assignments', icon: FileText, label: 'Assignments' },
        { to: '/assessments', icon: ClipboardList, label: 'Quizzes' },
      ]
    },
    {
      label: 'QUIZ MANAGEMENT',
      items: [
        { to: '/quiz-management', icon: Sparkles, label: 'Quiz Creator' },
        { to: '/quiz-monitor', icon: TrendingUp, label: 'Quiz Monitor' },
      ]
    },
    {
      label: 'PERFORMANCE',
      items: [
        { to: '/students', icon: Users, label: 'Students' },
        { to: '/subject-marks', icon: BarChart3, label: 'Marks Entry' },
        { to: '/faculty-insights', icon: BarChart3, label: 'Faculty Insights' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-white dark:bg-slate-900 border-r border-gray-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none z-10 relative"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 border-b border-gray-100 dark:border-slate-800/80"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">EduTrack</h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty Portal</p>
            </div>
          </div>
        </motion.div>

        {/* Subject Switcher */}
        {sidebarOpen && <SubjectSwitcher />}

        {/* Navigation */}
        <TooltipProvider>
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {sidebarOpen && (
                  <div className="mx-2 mb-2 px-3 py-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {group.label}
                    </p>
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                  
                  return (
                    <Tooltip key={item.to} delayDuration={50}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.to}
                          end={(item as any).end}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-100/50 dark:border-emerald-800/30'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="teacher-active-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full dark:bg-emerald-400"
                            />
                          )}
                          
                          <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors">
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                          </div>
                          
                          {sidebarOpen && (
                            <span className="text-sm tracking-wide truncate">
                              {item.label}
                            </span>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="right" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200/80 dark:border-slate-700 font-medium px-3 py-1.5 shadow-lg text-xs rounded-[1.5rem] hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>
        </TooltipProvider>

        {/* Bottom Actions */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 space-y-3 border-t border-gray-100 dark:border-slate-800/80"
          >

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100 hover:border-red-200 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:text-red-400 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Logout</span>
            </motion.button>
          </motion.div>
        )}

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-300">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
              {user?.name?.charAt(0) || 'T'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Teacher'}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Faculty Member</p>
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
          className="bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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

import { Outlet, NavLink } from 'react-router';
import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, Shield, FolderOpen, ClipboardCheck, Sparkles, GraduationCap, UserCheck, Bell, Moon, Sun, Menu, X } from 'lucide-react';
import { RoleSwitcher } from '../RoleSwitcher';
import { useTheme } from '../../theme/ThemeProvider';
import { motion } from 'framer-motion';
import { Button } from '../../theme/components';
import { useState } from 'react';

export function AdminLayout() {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/student-approvals', icon: UserCheck, label: 'Student Approvals' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
    { to: '/quizzes', icon: Shield, label: 'Quiz System' },
    { to: '/grading', icon: Sparkles, label: 'Auto Grading' },
    { to: '/performance-levels', icon: BarChart3, label: 'Performance Levels' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-gradient-to-b from-purple-600 to-purple-800 dark:from-purple-900 dark:to-purple-950 text-white flex flex-col overflow-hidden shadow-xl"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 border-b border-purple-500 dark:border-purple-700"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center backdrop-blur-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-white text-lg">EduTrack</h1>
              <p className="text-xs text-purple-200">Admin Panel</p>
            </div>
          </div>
        </motion.div>

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
                        : 'text-purple-100 hover:bg-white/10'
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

        {/* Theme Toggle & Role Switcher */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 space-y-4 border-t border-purple-500 dark:border-purple-700"
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
                  <span className="text-sm font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </>
              )}
            </motion.button>

            <RoleSwitcher />
          </motion.div>
        )}

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 border-t border-purple-500 dark:border-purple-700"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">AD</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-purple-200">System Admin</p>
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
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer"
            >
              <span className="text-sm font-semibold text-white">A</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

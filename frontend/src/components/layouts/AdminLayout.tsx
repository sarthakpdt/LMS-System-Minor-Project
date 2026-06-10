import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, FileText, BarChart3,
  Shield, FolderOpen, ClipboardCheck, Sparkles, UserCheck,
  Bell, Moon, Sun, Menu, X, LogOut, ChevronUp, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

export function AdminLayout() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Listen to scroll events to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.target.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    const mainEl = document.getElementById('admin-main-viewport');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleScrollToTop = () => {
    const mainEl = document.getElementById('admin-main-viewport');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  // Generate breadcrumbs dynamically based on path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const getBreadcrumbs = () => {
    if (pathSegments.length === 0) {
      return [{ label: 'Admin Dashboard', to: '/' }];
    }
    const crumbs = [{ label: 'Admin Dashboard', to: '/' }];
    let currentPath = '';
    pathSegments.forEach((segment, idx) => {
      currentPath += `/${segment}`;
      const matchingNav = navItems.find(item => item.to === currentPath);
      const label = matchingNav
        ? matchingNav.label
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, to: currentPath });
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const sidebarVariants = {
    open: { width: 256 },
    collapsed: { width: 80 }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-700 via-purple-800 to-indigo-900 dark:from-purple-950 dark:via-purple-900 dark:to-indigo-950 text-white select-none">
      {/* Logo Section */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5 text-white" />
          </motion.div>
          {(sidebarOpen || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-bold text-white text-lg tracking-wide">EduTrack</h1>
              <p className="text-[10px] uppercase font-bold text-purple-200 tracking-widest">Admin Panel</p>
            </motion.div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg hidden md:block text-purple-200 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation list */}
      <TooltipProvider>
        <nav className="flex-1 p-3 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {navItems.map((item) => (
            <Tooltip key={item.to} delayDuration={50}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-white/15 text-white font-medium shadow-md border border-white/10 backdrop-blur-md'
                        : 'text-purple-100 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0 text-purple-200 group-hover:text-white transition-colors" />
                  {(sidebarOpen || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm tracking-wide"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              </TooltipTrigger>
              {(!sidebarOpen && !isMobile) && (
                <TooltipContent side="right" className="bg-slate-900 border border-slate-800 text-white font-medium px-3 py-1.5 shadow-xl text-xs rounded-lg">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-sm font-semibold text-white">AD</span>
          </div>
          {(sidebarOpen || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0"
            >
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-purple-300 truncate">System Admin</p>
            </motion.div>
          )}
        </div>

        {/* Logout button */}
        {(sidebarOpen || isMobile) ? (
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 transition-all font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>
        ) : (
          <TooltipProvider>
            <Tooltip delayDuration={50}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-red-950 border border-red-800 text-red-100 font-semibold px-3 py-1.5 shadow-xl text-xs rounded-lg">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial="open"
        animate={sidebarOpen ? 'open' : 'collapsed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-full shadow-2xl relative z-20 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Glassmorphic Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/75 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-xs transition-colors duration-300"
        >
          {/* Left: Hamburger + Breadcrumbs */}
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 md:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-700 dark:text-slate-300 transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>

            {/* Desktop toggle button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg hidden md:block text-gray-700 dark:text-slate-300 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
              {breadcrumbs.map((crumb, idx) => (
                <div key={crumb.to} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" />}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-gray-900 dark:text-white font-semibold">{crumb.label}</span>
                  ) : (
                    <NavLink to={crumb.to} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {crumb.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-slate-300 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700/50 shadow-inner"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </motion.button>

            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-slate-300 transition-colors relative border border-transparent hover:border-gray-200 dark:hover:border-slate-700/50"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 dark:bg-purple-500 rounded-full" />
            </motion.button>

            <div className="w-px h-6 bg-gray-200 dark:bg-slate-800" />

            {/* Admin Avatar Dropdown */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer shadow-md border border-purple-400/25 select-none"
            >
              <span className="text-sm font-semibold text-white">A</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Viewport content */}
        <main id="admin-main-viewport" className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          {/* Background Watermark Watermark Illustration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[0] flex items-center justify-center">
            <img
              src="/illustrations/admin-hero.png"
              alt="Admin background illustration"
              className="w-full max-w-[750px] h-auto opacity-[0.05] dark:opacity-[0.02] object-contain select-none filter saturate-[0.3]"
              draggable={false}
            />
          </div>
          
          {/* Actual Child Page */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-[1]"
          >
            <Outlet />
          </motion.div>

          {/* Floating Scroll-to-Top Button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleScrollToTop}
                className="fixed bottom-6 right-6 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl transition-colors border border-purple-500/20 flex items-center justify-center"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

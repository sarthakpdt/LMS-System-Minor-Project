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

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      ]
    },
    {
      label: 'USER MANAGEMENT',
      items: [
        { to: '/students', icon: Users, label: 'Students' },
        { to: '/student-approvals', icon: UserCheck, label: 'Student Approvals' },
      ]
    },
    {
      label: 'ACADEMICS',
      items: [
        { to: '/courses', icon: BookOpen, label: 'Courses' },
        { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
        { to: '/assignments', icon: FileText, label: 'Assignments' },
        { to: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
        { to: '/quizzes', icon: Shield, label: 'Quiz System' },
      ]
    },
    {
      label: 'PERFORMANCE',
      items: [
        { to: '/grading', icon: Sparkles, label: 'Auto Grading' },
        { to: '/performance-levels', icon: BarChart3, label: 'Performance Levels' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { to: '/notifications', icon: Bell, label: 'Notifications' },
      ]
    }
  ];

  const allNavItems = navGroups.flatMap(g => g.items);

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
      const matchingNav = allNavItems.find(item => item.to === currentPath);
      const label = matchingNav
        ? matchingNav.label
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, to: currentPath });
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const sidebarVariants = {
    open: { width: 280 },
    collapsed: { width: 80 }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 dynamic-text-white select-none hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {/* Logo Section */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5 dynamic-text-white" />
          </motion.div>
          {(sidebarOpen || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-bold dynamic-text-white text-lg tracking-wide">EduTrack</h1>
              <p className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-300 tracking-widest">Admin Panel</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <TooltipProvider>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-0.5">
              {(sidebarOpen || isMobile) && (
                <div className="mx-2 mb-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-md border border-amber-100/50 dark:border-amber-500/20">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-[0.1em]">
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
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-indigo-50/50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {/* Active Indicator Accent Line */}
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"
                          />
                        )}
                        
                        <div className={`flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        
                        {(sidebarOpen || isMobile) && (
                          <span className="text-sm tracking-wide truncate">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </TooltipTrigger>
                    {(!sidebarOpen && !isMobile) && (
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

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Profile Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-sm font-semibold text-white">AD</span>
          </div>
          {(sidebarOpen || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0"
            >
              <p className="text-xs font-semibold dynamic-text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-gray-500 dark:text-purple-300 truncate">System Admin</p>
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
              <TooltipContent side="right" className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-100 font-semibold px-3 py-1.5 shadow-lg text-xs rounded-lg">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen dynamic-bg-main transition-colors duration-300 overflow-hidden">
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
          className="sticky top-0 z-10 premium-glass px-6 py-4 flex items-center justify-between hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
          {/* Animated Premium Background */}
          <div className="absolute inset-0 pointer-events-none z-[0] hero-gradient" />
          
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

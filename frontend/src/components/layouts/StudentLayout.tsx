import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, FolderOpen, ClipboardList, Award, Bell, LogOut, TrendingUp, FileText, Menu, X, Sun, Moon, Brain } from 'lucide-react';
import { toast } from 'sonner';
import AILearningAssistant from '../student/AILearningAssistant';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { motion } from 'framer-motion';
import NotificationsPanel from '../teacher/NotificationsPanel';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';

export function StudentLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/', icon: Home, label: 'My Dashboard', end: true },
      ]
    },
    {
      label: 'LEARNING',
      items: [
        { to: '/courses', icon: BookOpen, label: 'My Courses' },
        { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
      ]
    },
    {
      label: 'ASSESSMENTS',
      items: [
        { to: '/assignments', icon: FileText, label: 'Assignments' },
        { to: '/quizzes', icon: ClipboardList, label: 'Quizzes & Tests' },
      ]
    },
    {
      label: 'PERFORMANCE',
      items: [
        { to: '/my-progress', icon: TrendingUp, label: 'My Progress & Level' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { action: () => setShowNotif(!showNotif), icon: Bell, label: 'Notifications' },
        { action: () => setShowAI(!showAI), icon: Brain, label: 'AI Assistant', isActive: showAI },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully', {
      description: 'See you next time!',
    });
  };

  const location = useLocation();

  return (
    <div 
      className="flex h-screen transition-colors duration-300"
      style={{
        background: theme === 'dark' 
          ? 'linear-gradient(to bottom right, #020617, #0f172a)' 
          : 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)'
      }}
    >
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="border-r flex flex-col shadow-xl z-20 overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          borderColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(229, 231, 235, 0.8)'
        }}
      >
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Award className="w-5 h-5 text-white" />
            </motion.div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0"
              >
                <h1 className="font-bold text-gray-900 dark:text-white truncate">EduTrack</h1>
                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-widest truncate">Student Portal</p>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Notifications Badge */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-blue-200 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">3 Upcoming Quizzes</p>
              </div>
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">3</span>
            </div>
          </div>
        )}

        <TooltipProvider>
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-0.5">
                {sidebarOpen && (
                  <div className="mx-2 mb-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-md border border-blue-100/50 dark:border-blue-500/20">
                    <p className="text-[11px] font-bold text-blue-800 dark:text-blue-500 uppercase tracking-[0.1em]">
                      {group.label}
                    </p>
                  </div>
                )}
                {group.items.map((item: any) => {
                  if (item.action) {
                    const isActive = item.isActive;
                    return (
                      <Tooltip key={item.label} delayDuration={50}>
                        <TooltipTrigger asChild>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              item.action();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                              isActive
                                ? (theme === 'dark' ? 'bg-slate-800 text-blue-400 font-medium shadow-sm' : 'text-blue-700 font-medium bg-transparent')
                                : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId={`student-action-indicator-${item.label}`}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                              />
                            )}
                            <div className={`flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors ${
                              isActive 
                                ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                                : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-400 group-hover:text-gray-700')
                            }`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            {sidebarOpen && (
                              <span className="text-sm tracking-wide truncate">
                                {item.label}
                              </span>
                            )}
                          </a>
                        </TooltipTrigger>
                        {!sidebarOpen && (
                          <TooltipContent side="right" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200/80 dark:border-slate-700 font-medium px-3 py-1.5 shadow-lg text-xs rounded-[1.5rem] hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  }

                  const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                  
                  return (
                    <Tooltip key={item.to} delayDuration={50}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.to}
                          end={(item as any).end}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                            isActive
                              ? (theme === 'dark' ? 'bg-slate-800 text-blue-400 font-medium shadow-sm' : 'text-blue-700 font-medium bg-transparent')
                              : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="student-active-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                            />
                          )}
                          
                          <div className={`flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors ${
                            isActive 
                              ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                              : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-400 group-hover:text-gray-700')
                          }`}>
                            <item.icon className="w-5 h-5" />
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

        

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:border-gray-200 dark:hover:border-slate-600 hover:shadow-md transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{user?.department || 'Department'}</p>
              </div>
            )}
          </motion.div>
          
          {sidebarOpen ? (
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all font-medium text-sm border border-red-100 dark:border-red-500/20"
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
                    className="w-full flex items-center justify-center p-2.5 text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all border border-red-100 dark:border-red-500/20"
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
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="backdrop-blur-md border-b px-6 py-4 flex items-center justify-end shadow-sm z-10 transition-colors duration-300"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme === 'dark' ? 'rgba(30, 41, 59, 1)' : 'rgba(229, 231, 235, 0.8)'
          }}
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>
          </div>
        </motion.header>

        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Sidebar */}
      {showAI && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-xl z-50 border-l border-gray-200/80 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <button
            onClick={() => setShowAI(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-full overflow-auto p-4">
            <h2 className="text-xl font-bold mb-4 mt-4">AI Learning Assistant</h2>
            <AILearningAssistant />
          </div>
        </motion.div>
      )}

      {/* Notifications Sidebar */}
      {showNotif && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed right-0 top-0 bottom-0 w-96 max-w-[100vw] bg-white dark:bg-gray-800 shadow-xl z-50 border-l border-gray-200/80 dark:border-gray-700"
        >
          <button
            onClick={() => setShowNotif(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="h-full overflow-auto p-6 pt-12">
            <NotificationsPanel userId={user?._id} role="student" userName={user?.name} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
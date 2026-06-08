import { useState, useMemo } from "react";
import { RouterProvider } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoleContext } from "./contexts/RoleContext";
import { Toaster } from "./components/ui/sonner";
import { createRouterForRole } from "./routes";

function AppContent() {
  const { user, loading } = useAuth();

  // role state
  const [currentRole, setCurrentRole] = useState<
    "student" | "teacher" | "admin"
  >(user?.role || "student");

  // jab user login kare → role update ho
  useMemo(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user]);

  // router create based on role
  const router = useMemo(() => createRouterForRole(currentRole), [currentRole]);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-gray-900 bg-green-400 ds-badge-pulse" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">EduTrack</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading your workspace...</p>
        </div>
        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full ds-shimmer" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );

  return (
    <RoleContext.Provider value={{ role: currentRole, setRole: setCurrentRole }}>
      <RouterProvider router={router} />
      <Toaster />
    </RoleContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
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

  if (loading) return <div>Loading...</div>;

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
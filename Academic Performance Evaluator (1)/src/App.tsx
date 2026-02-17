import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { RoleContext } from './contexts/RoleContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { createRouterForRole } from './routes';


function App() {
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student'>('admin');
  const router = createRouterForRole(currentRole);

  return (
    <AuthProvider>
      <RoleContext.Provider value={{ role: currentRole, setRole: setCurrentRole }}>
        <RouterProvider router={router} />
        <Toaster />
      </RoleContext.Provider>
    </AuthProvider>
  );
}

export default App;
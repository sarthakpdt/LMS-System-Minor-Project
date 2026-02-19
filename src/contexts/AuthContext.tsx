import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// --- Types & Interfaces ---
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

interface StudentSignupData {
  name: string;
  email: string;
  password: string;
  role: 'student';
  studentId: string;
}

interface TeacherSignupData {
  name: string;
  email: string;
  password: string;
  role: 'teacher';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // Vital for ProtectedRoute
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

// 1. Create the Context object
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user/token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('lms_token');
      const storedUser = localStorage.getItem('lms_current_user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          localStorage.removeItem('lms_token');
          localStorage.removeItem('lms_current_user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // LOGIN Logic
  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Login failed' };
      }

      const { token, data } = result;
      localStorage.setItem('lms_token', token);
      localStorage.setItem('lms_current_user', JSON.stringify(data.user));
      
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Server error. Please check your connection.' };
    }
  };

  // SIGNUP Logic
  const signup = async (userData: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Signup failed' };
      }

      if (userData.role === 'student') {
        return { 
          success: true, 
          message: 'Account created! Please wait for admin approval.' 
        };
      }

      if (result.token) {
        localStorage.setItem('lms_token', result.token);
        localStorage.setItem('lms_current_user', JSON.stringify(result.data.user));
        setUser(result.data.user);
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_current_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading, // Pass loading to the provider
      login, 
      signup, 
      logout 
    }}>
      {/* Do not render children until initial auth check is done to prevent flickering/redirect loops */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 2. THE EXPORTED HOOK (This is what RoleSwitcher.tsx is looking for)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
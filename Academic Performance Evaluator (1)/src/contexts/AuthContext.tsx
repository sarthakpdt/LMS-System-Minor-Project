import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (userData: any) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('lms_current_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) return { success: false, message: data.message };

    if (data.user.role === 'student' && data.user.approvalStatus !== 'approved') {
      return { success: false, message: 'Wait for admin approval' };
    }

    setUser(data.user);
    localStorage.setItem('lms_current_user', JSON.stringify(data.user));

    return { success: true };
  };

  const signup = async (userData: any) => {
    const nameParts = userData.name.split(' ');

    const payload = {
      email: userData.email,
      password: userData.password,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || '',
      role: userData.role,
      phoneNo: userData.phone,
      dob: userData.dateOfBirth,

      studentId: userData.studentId,
      department: userData.department,
      semester: Number(userData.semester),

      teacherId: userData.employeeId,
      specialization: userData.specialization,
      qualification: userData.qualification,
    };

    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) return { success: false, message: data.message };

    return { success: true, message: 'Registered successfully' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lms_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "student" | "teacher" | "admin";

interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  department?: string;
  semester?: string;
  studentId?: string;
  employeeId?: string;
  approvalStatus?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<any>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ================= LOGIN =================
  const login = async (email: string, password: string, role: Role) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || "Login failed" };
      }

      const userFromResponse = data?.user || data?.data?.user || null;
      const token = data?.token || null;

      if (!userFromResponse || !token) {
        return { success: false, message: "Invalid response from server" };
      }

      // ✅ Build user directly from login response — no extra API call
      const userData: User = {
        id: userFromResponse.id || userFromResponse._id || "",
        email: userFromResponse.email,
        role: userFromResponse.role,
        token: token,
        name: userFromResponse.name || undefined,
        approvalStatus: userFromResponse.approvalStatus || undefined,
        semester: userFromResponse.semester || undefined,
        department: userFromResponse.department || undefined,
        studentId: userFromResponse.studentId || undefined,
        employeeId: userFromResponse.employeeId || undefined,
      };

      setUser(userData);
      localStorage.setItem("lms_user", JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Server error" };
    } finally {
      setLoading(false);
    }
  };

  // ================= SIGNUP =================
  const signup = async (formData: any) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || "Registration failed" };
      }

      // ✅ Store full user directly from register response
      if (data.token && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id || "",
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          name: data.user.name || undefined,
          approvalStatus: data.user.approvalStatus || undefined,
          semester: data.user.semester || undefined,
          department: data.user.department || undefined,
          studentId: data.user.studentId || undefined,
          employeeId: data.user.employeeId || undefined,
        };

        setUser(userData);
        localStorage.setItem("lms_user", JSON.stringify(userData));
      }

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, message: "Server error" };
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("lms_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

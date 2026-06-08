import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "student" | "teacher" | "admin";

interface AssignedCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
}

interface User {
  id: string;       // ← This is what Dashboard uses: user?.id  
  email: string;
  name?: string;
  role: Role;
  department?: string;
  specialization?: string;
  semester?: string;
  studentId?: string;
  employeeId?: string;
  approvalStatus?: string;
  assignedCourses?: AssignedCourse[];
  token: string;
}

interface AuthContextType {
  user: User | null;
  activeSubject: AssignedCourse | null;
  setActiveSubject: (subject: AssignedCourse | null) => void;
  login: (email: string, password: string, role: Role) => Promise<any>;
  signup: (data: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSubject, setActiveSubjectState] = useState<AssignedCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("lms_user");
      }
    }

    const storedSubject = localStorage.getItem("lms_active_subject");
    if (storedSubject) {
      try {
        setActiveSubjectState(JSON.parse(storedSubject));
      } catch {
        localStorage.removeItem("lms_active_subject");
      }
    }

    setLoading(false);
  }, []);

  const setActiveSubject = (subject: AssignedCourse | null) => {
    setActiveSubjectState(subject);
    if (subject) {
      localStorage.setItem("lms_active_subject", JSON.stringify(subject));
    } else {
      localStorage.removeItem("lms_active_subject");
    }
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, role: Role) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      console.log("Login full response:", data, "Status:", res.status);

      if (!res.ok) {
        return { success: false, message: data.message || "Login failed" };
      }

      const userFromResponse = data?.user || data?.data?.user || null;
      const token = data?.token || data?.data?.token || null;

      if (!userFromResponse || !token) {
        return { success: false, message: "Invalid response from server" };
      }

      // ── IMPORTANT: id is stored as "id" (string), NOT "_id" ──────────────
      // All components must use user?.id  (not user?._id)
      const userData: User = {
        id: userFromResponse.id || userFromResponse._id || "",
        email: userFromResponse.email,
        role: userFromResponse.role,
        token,
        name: userFromResponse.name || undefined,
        approvalStatus: userFromResponse.approvalStatus || undefined,
        semester: userFromResponse.semester
          ? String(userFromResponse.semester)
          : undefined,
        department: userFromResponse.department || undefined,
        specialization: userFromResponse.specialization || undefined,
        studentId: userFromResponse.studentId || undefined,
        employeeId: userFromResponse.employeeId || undefined,
        assignedCourses: userFromResponse.assignedCourses || [],
      };

      setUser(userData);
      localStorage.setItem("lms_user", JSON.stringify(userData));

      return {
        success: true,
        userName: userData.name || email.split("@")[0],
        assignedCourses: userData.assignedCourses || [],
        setActiveSubject,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Server error. Is the backend running?" };
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const signup = async (formData: any) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Signup full response:", data, "Status:", res.status);

      if (!res.ok) {
        return { success: false, message: data.message || "Registration failed" };
      }

      if (data.token && data.user && data.user.role !== "student") {
        const userData: User = {
          id: data.user.id || data.user._id || "",
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          name: data.user.name || undefined,
          approvalStatus: data.user.approvalStatus || undefined,
          semester: data.user.semester ? String(data.user.semester) : undefined,
          department: data.user.department || undefined,
          specialization: data.user.specialization || undefined,
          studentId: data.user.studentId || undefined,
          employeeId: data.user.employeeId || undefined,
          assignedCourses: data.user.assignedCourses || [],
        };
        setUser(userData);
        localStorage.setItem("lms_user", JSON.stringify(userData));
      }

      return { success: true, pending: data.user?.role === "student" };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, message: "Server error" };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setActiveSubjectState(null);
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_active_subject");
  };

  return (
    <AuthContext.Provider
      value={{ user, activeSubject, setActiveSubject, login, signup, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
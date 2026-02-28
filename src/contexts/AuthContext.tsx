import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "student" | "teacher" | "admin";

interface User {
  id: string;           // MongoDB _id from server
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

  // ✅ LOAD USER FROM LOCALSTORAGE ON REFRESH
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      console.log("Login full response:", { status: res.status, data });

      if (!res.ok) {
        const message = data.message || data.error || "Login failed";
        console.error("Login failed with status", res.status, "->", message, "(full response)", data);
        return { success: false, message };
      }

      // Handle different possible response structures
      const userFromResponse = data?.user || data?.data?.user || null;
      const token = data?.token || null;

      if (!userFromResponse || !token) {
        console.error("Invalid response structure. Got:", { user: userFromResponse, token });
        return { success: false, message: "Invalid response from server" };
      }

      // start with the basic fields returned by auth
      let userData: User = {
        id: userFromResponse.id || userFromResponse._id || "",
        email: userFromResponse.email,
        role: userFromResponse.role,
        token: token,
        name: userFromResponse.name || undefined,
        approvalStatus: userFromResponse.approvalStatus || undefined,
      };

      // Attempt to fetch a fuller profile (student/teacher) from the API
      try {
        if (userData.role === 'student') {
          const profileRes = await fetch(`http://localhost:5000/api/admin/students/${userData.id}`);
          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            const full = profileJson.data || profileJson;
            userData = {
              ...userData,
              name: full.name || userData.name,
              department: full.department,
              semester: full.semester,
              studentId: full.studentId,
              approvalStatus: full.approvalStatus || userData.approvalStatus,
            };
          }
        } else if (userData.role === 'teacher') {
          const profileRes = await fetch(`http://localhost:5000/api/admin/teachers/${userData.id}`);
          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            const full = profileJson.data || profileJson;
            userData = {
              ...userData,
              name: full.name || userData.name,
              department: full.department,
              employeeId: full.employeeId,
              approvalStatus: full.approvalStatus || userData.approvalStatus,
            };
          }
        }
      } catch (err) {
        console.warn('Could not fetch full profile after login:', err);
      }

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
      
      console.log("Sending signup data:", formData);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Signup response:", data, "Status:", res.status);

      if (!res.ok) {
        const message = data.message || data.error || "Registration failed";
        console.error("Signup validation failed (status", res.status, "):", message, data);
        return { success: false, message };
      }

      // If signup successful, optionally auto-login the user
      if (data.token && data.user) {
        let userData: User = {
          id: data.user.id || data.user._id || "",
          email: data.user.email,
          role: data.user.role,
          token: data.token,
          name: data.user.name || undefined,
          approvalStatus: data.user.approvalStatus || undefined,
        };

        // Try to fetch full profile similar to login
        try {
          if (userData.role === 'student') {
            const profileRes = await fetch(`http://localhost:5000/api/admin/students/${userData.id}`);
            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              const full = profileJson.data || profileJson;
              userData = {
                ...userData,
                name: full.name || userData.name,
                department: full.department,
                semester: full.semester,
                studentId: full.studentId,
                approvalStatus: full.approvalStatus || userData.approvalStatus,
              };
            }
          } else if (userData.role === 'teacher') {
            const profileRes = await fetch(`http://localhost:5000/api/admin/teachers/${userData.id}`);
            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              const full = profileJson.data || profileJson;
              userData = {
                ...userData,
                name: full.name || userData.name,
                department: full.department,
                employeeId: full.employeeId,
                approvalStatus: full.approvalStatus || userData.approvalStatus,
              };
            }
          }
        } catch (err) {
          console.warn('Could not fetch full profile after signup:', err);
        }

        setUser(userData);
        localStorage.setItem("lms_user", JSON.stringify(userData));
        console.log("User auto-logged in after signup");
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

// ================= CUSTOM HOOK =================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
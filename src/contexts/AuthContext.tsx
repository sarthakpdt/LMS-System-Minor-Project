import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Role = "student" | "teacher" | "admin";

interface User {
  id: string;           // MongoDB _id from server
  email: string;
  role: Role;
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
        console.error("Login failed with status", res.status, ":", data);
        return { success: false, message: data.message || "Login failed" };
      }

      // Handle different possible response structures
      const userFromResponse = data?.user || data?.data?.user || null;
      const token = data?.token || null;

      if (!userFromResponse || !token) {
        console.error("Invalid response structure. Got:", { user: userFromResponse, token });
        return { success: false, message: "Invalid response from server" };
      }

      const userData: User = {
        id: userFromResponse.id || userFromResponse._id || "",
        email: userFromResponse.email,
        role: userFromResponse.role,
        token: token,
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
        console.error("Signup validation failed:", data);
        return { success: false, message: data.message || "Registration failed" };
      }

      // If signup successful, optionally auto-login the user
      if (data.token && data.user) {
        const userData: User = {
          id: data.user.id || data.user._id || "",
          email: data.user.email,
          role: data.user.role,
          token: data.token,
        };
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
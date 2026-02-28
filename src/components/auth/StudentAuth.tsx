import { useState } from 'react';
import { motion } from 'framer-motion'; // Corrected from 'motion/react'
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, GraduationCap, Hash, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNavigate } from 'react-router-dom';

export function StudentAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    department: '',
    semester: '',
    year: '',
    course: '',
    phone: '',
    dateOfBirth: '',
  });

  // Consolidated Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use loginData state instead of undefined variables
      const result = await login(loginData.email, loginData.password, role);
      
      if (result.success) {
        toast.success('Login successful!', {
          description: `Welcome back to the ${role} portal`,
        });
        
        // This ensures the App.tsx router re-calculates the role before navigating
        navigate('/'); 
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error('Login failed', { description: result.message });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Validation error', { description: 'Passwords do not match' });
      return;
    }

    // Validate required fields
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('Please fill all required fields');
      toast.error('Validation error', { description: 'Name, email, and password are required' });
      return;
    }

    // Validate role-specific fields
    if (role === 'student') {
      if (!signupData.studentId || !signupData.department || !signupData.semester || !signupData.phone) {
        setError('Please fill all student information fields');
        toast.error('Validation error', { description: 'All student fields are required for students' });
        return;
      }
    } else if (role === 'teacher') {
      if (!signupData.studentId || !signupData.phone) {
        setError('Please fill all teacher information fields');
        toast.error('Validation error', { description: 'Employee ID and Phone are required for teachers' });
        return;
      }
    } else if (role === 'admin') {
      if (!signupData.studentId || !signupData.phone) {
        setError('Please fill all admin information fields');
        toast.error('Validation error', { description: 'Employee ID and Phone are required for admins' });
        return;
      }
    }

    setLoading(true);

    try {
      // Only send fields that backend expects
      let finalData: any = {
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        role: role,
      };

      // Add role-specific fields
      if (role === 'student') {
        finalData = {
          ...finalData,
          studentId: signupData.studentId.trim(),
          department: signupData.department,
          semester: signupData.semester,
          phone: signupData.phone.trim(),
        };
      } else if (role === 'teacher') {
        finalData = {
          ...finalData,
          employeeId: signupData.studentId.trim(), // Use studentId field for employeeId
          phone: signupData.phone.trim(),
        };
      } else if (role === 'admin') {
        finalData = {
          ...finalData,
          employeeId: signupData.studentId.trim(), // Use studentId field for employeeId
          phone: signupData.phone.trim(),
        };
      }

      console.log("Frontend sending signup data:", finalData);
      const result = await signup(finalData);

      if (result.success) {
        toast.success('Account created!', {
          description: role === 'student' ? 'Redirecting to your portal...' : 'Account pending verification. Redirecting...',
          duration: 3000,
        });
        
        // Check if user was auto-logged in after signup
        setTimeout(() => {
          const loggedInUser = localStorage.getItem("lms_user");
          if (loggedInUser) {
            // User was auto-logged in, redirect to home
            console.log("User auto-logged in. Redirecting...");
            navigate('/');
          } else {
            // User wasn't auto-logged in, switch to login tab
            console.log("User not logged in yet. Switching to login tab.");
            setIsLogin(true);
          }
        }, 500);
      } else {
        setError(result.message || 'Signup failed');
        toast.error('Signup failed', { description: result.message });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: '10%', left: '10%' }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Branding Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white space-y-6 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">EduTrack LMS</h1>
                <p className="text-blue-100 text-lg">Manage. Learn. Excel.</p>
              </div>
            </div>
            <div className="space-y-4 mt-12">
              <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Multi-Role Access</h3>
                  <p className="text-blue-100">Tailored dashboards for Students, Teachers, and Administrators.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Auth Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-8">
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'}`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
              )}

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">I am a...</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger className="w-full h-11 border-gray-300">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-11 pr-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600">
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Role Selector for Signup */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Sign up as a...</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger className="w-full h-11 border-gray-300">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Common Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-name"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className="pl-11 h-11"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email Address</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-11 h-11"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditional Student Fields */}
                  {role === 'student' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-studentId">Student ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-studentId"
                              value={signupData.studentId}
                              onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })}
                              className="pl-11 h-11"
                              required={role === 'student'}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-phone"
                              type="tel"
                              value={signupData.phone}
                              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                              className="pl-11 h-11"
                              required={role === 'student'}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Department</Label>
                          <Select onValueChange={(v) => setSignupData({ ...signupData, department: v })}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CS">Computer Science</SelectItem>
                              <SelectItem value="EE">Electrical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Semester</Label>
                          <Select onValueChange={(v) => setSignupData({ ...signupData, semester: v })}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Conditional Teacher Fields */}
                  {role === 'teacher' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-employeeId">Employee ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-employeeId"
                              value={signupData.studentId}
                              onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })}
                              className="pl-11 h-11"
                              placeholder="Enter your Employee ID"
                              required={role === 'teacher'}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone-teacher">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-phone-teacher"
                              type="tel"
                              value={signupData.phone}
                              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                              className="pl-11 h-11"
                              required={role === 'teacher'}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Conditional Admin Fields */}
                  {role === 'admin' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-adminId">Employee ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-adminId"
                              value={signupData.studentId}
                              onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })}
                              className="pl-11 h-11"
                              placeholder="Enter your Employee ID"
                              required={role === 'admin'}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone-admin">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="signup-phone-admin"
                              type="tel"
                              value={signupData.phone}
                              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                              className="pl-11 h-11"
                              required={role === 'admin'}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 mt-4">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
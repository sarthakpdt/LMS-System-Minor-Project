import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, Hash, ArrowRight, Sparkles, Beaker, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNavigate } from 'react-router-dom';

// ─── Shared Department list (imported by TeacherAuth too) ────────────────────
export const DEPARTMENTS = [
  { value: 'CS',   label: 'Computer Science & Engineering' },
  { value: 'IT',   label: 'Information Technology' },
  { value: 'ECE',  label: 'Electronics & Communication Engineering' },
  { value: 'EE',   label: 'Electrical Engineering' },
  { value: 'ME',   label: 'Mechanical Engineering' },
  { value: 'CE',   label: 'Civil Engineering' },
  { value: 'CH',   label: 'Chemical Engineering' },
  { value: 'BT',   label: 'Biotechnology' },
  { value: 'MBA',  label: 'Master of Business Administration' },
  { value: 'MCA',  label: 'Master of Computer Applications' },
];

export function StudentAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    employeeId: '',
    department: '',
    specialization: '',
    semester: '',
    phone: '',
    subjects: [] as string[],
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(loginData.email, loginData.password, role);
      if (result.success) {
        toast.success('Login successful!', { description: `Welcome back to the ${role} portal` });
        navigate('/');
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error('Login failed', { description: result.message });
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Signup ───────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Validation error', { description: 'Passwords do not match' });
      return;
    }
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('Please fill all required fields');
      return;
    }
    if (role === 'student' && (!signupData.studentId || !signupData.department || !signupData.semester || !signupData.phone)) {
      setError('Please fill all student information fields');
      return;
    }
    if (role === 'teacher' && (!signupData.employeeId || !signupData.phone || !signupData.department)) {
      setError('Employee ID, department and phone are required for teachers');
      return;
    }
    if (role === 'admin' && (!signupData.employeeId || !signupData.phone)) {
      setError('Employee ID and phone are required for admins');
      return;
    }

    setLoading(true);
    try {
      let finalData: any = {
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        role,
      };

      if (role === 'student') {
        finalData = { ...finalData, studentId: signupData.studentId.trim(), department: signupData.department, semester: signupData.semester, phone: signupData.phone.trim() };
      } else if (role === 'teacher') {
        finalData = { ...finalData, employeeId: signupData.employeeId.trim(), phone: signupData.phone.trim(), department: signupData.department, specialization: signupData.specialization.trim() };
        if (signupData.subjects.length) {
          finalData.assignedCourses = signupData.subjects.map((s: string) => ({ courseCode: s, courseName: s }));
        }
      } else if (role === 'admin') {
        finalData = { ...finalData, employeeId: signupData.employeeId.trim(), phone: signupData.phone.trim() };
      }

      const result = await signup(finalData);
      if (result.success) {
        if (result.pending) {
          toast.success('Account created!', { description: 'Your account is pending admin approval.', duration: 4000 });
          setIsLogin(true);
        } else {
          toast.success('Account created!', { description: 'Redirecting...', duration: 2000 });
          setTimeout(() => navigate('/'), 500);
        }
      } else {
        setError(result.message || 'Signup failed');
        toast.error('Signup failed', { description: result.message });
      }
    } catch {
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
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '10%' }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Branding */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="text-white space-y-6 hidden md:block">
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

          {/* Right Auth Form */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              {/* Login / Signup Toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-8">
                <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'}`}>Login</button>
                <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'}`}>Sign Up</button>
              </div>

              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

              {/* ── LOGIN FORM ── */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">I am a...</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger className="w-full h-11 border-gray-300"><SelectValue placeholder="Select your role" /></SelectTrigger>
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
                      <Input id="login-email" type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="pl-11 h-12" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="pl-11 pr-11 h-12" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600">
                    {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              ) : (
                /* ── SIGNUP FORM ── */
                <form onSubmit={handleSignup} className="space-y-4 max-h-[560px] overflow-y-auto pr-2">
                  {/* Role Selector */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Sign up as a...</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger className="w-full h-11 border-gray-300"><SelectValue placeholder="Select your role" /></SelectTrigger>
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
                        <Input id="signup-name" value={signupData.name} onChange={(e) => setSignupData({ ...signupData, name: e.target.value })} className="pl-11 h-11" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email Address</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="signup-email" type="email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} className="pl-11 h-11" required />
                      </div>
                    </div>
                  </div>

                  {/* ── STUDENT FIELDS ── */}
                  {role === 'student' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-studentId">Student ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-studentId" value={signupData.studentId} onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })} className="pl-11 h-11" placeholder="e.g. 2024CS001" required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-phone" type="tel" value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} className="pl-11 h-11" placeholder="10-digit number" required />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Department</Label>
                          <div className="relative mt-2">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                            <select
                              value={signupData.department}
                              onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                              className="w-full pl-11 h-11 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none pr-4"
                              required
                            >
                              <option value="">Select department…</option>
                              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label>Semester</Label>
                          <Select onValueChange={(v) => setSignupData({ ...signupData, semester: v })}>
                            <SelectTrigger className="h-11 mt-2"><SelectValue placeholder="Select semester" /></SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── TEACHER FIELDS ── */}
                  {role === 'teacher' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-employeeId">Employee ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-employeeId" value={signupData.employeeId} onChange={(e) => setSignupData({ ...signupData, employeeId: e.target.value })} className="pl-11 h-11" placeholder="e.g. EMP2024001" required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone-teacher">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-phone-teacher" type="tel" value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} className="pl-11 h-11" placeholder="10-digit number" required />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-dept-teacher">Department</Label>
                          <div className="relative mt-2">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                            <select
                              id="signup-dept-teacher"
                              value={signupData.department}
                              onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                              className="w-full pl-11 h-11 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none pr-4"
                              required
                            >
                              <option value="">Select department…</option>
                              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-specialization">Specialization</Label>
                          <div className="relative mt-2">
                            <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-specialization" placeholder="e.g. Machine Learning" value={signupData.specialization} onChange={(e) => setSignupData({ ...signupData, specialization: e.target.value })} className="pl-11 h-11" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 font-medium">Subjects you teach</Label>
                        <select
                          multiple
                          value={signupData.subjects}
                          onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                            setSignupData({ ...signupData, subjects: opts });
                          }}
                          className="w-full h-32 mt-2 pl-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                          {['Mathematics I', 'Physics I', 'Data Structures', 'Operating Systems', 'Machine Learning', 'Computer Networks', 'DBMS', 'Software Engineering', 'Algorithms', 'Digital Electronics'].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                      </div>
                    </motion.div>
                  )}

                  {/* ── ADMIN FIELDS ── */}
                  {role === 'admin' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-adminId">Employee ID</Label>
                          <div className="relative mt-2">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-adminId" value={signupData.employeeId} onChange={(e) => setSignupData({ ...signupData, employeeId: e.target.value })} className="pl-11 h-11" placeholder="Enter Employee ID" required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-phone-admin">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input id="signup-phone-admin" type="tel" value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })} className="pl-11 h-11" required />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Password Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="signup-password" type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="pl-11 h-11" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input id="signup-confirm" type="password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} className="pl-11 h-11" required />
                      </div>
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
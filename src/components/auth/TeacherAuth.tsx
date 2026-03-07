import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Hash, ArrowRight, Users, BookOpen, GraduationCap, Building2, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const DEPARTMENTS = [
  { value: 'CS',   label: 'Computer Science' },
  { value: 'EE',   label: 'Electrical Engineering' },
  { value: 'ME',   label: 'Mechanical Engineering' },
  { value: 'CE',   label: 'Civil Engineering' },
  { value: 'BA',   label: 'Business Administration' },
  { value: 'MATH', label: 'Mathematics' },
  { value: 'PHYS', label: 'Physics' },
  { value: 'CHEM', label: 'Chemistry' },
  { value: 'Other','label': 'Other' },
];

export function TeacherAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Subject selection step after successful credential check
  const [subjectStep, setSubjectStep] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<{ courseCode: string; courseName: string; semester: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  const { login, signup } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    phone: '',
    department: '',
    specialization: '',
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(loginData.email, loginData.password, 'teacher');

      if (!result.success) {
        setError(result.message || 'Login failed');
        toast.error('Login failed', { description: result.message || 'Invalid email or password' });
        return;
      }

      // Check if teacher has assigned courses → show subject picker
      const courses = result.assignedCourses || [];
      if (courses.length > 0) {
        setAvailableSubjects(courses);
        setPendingLoginData(result);
        setSubjectStep(true);
      } else {
        // No courses assigned yet — go straight to dashboard
        toast.success('Login successful!', { description: 'Welcome back to EduTrack LMS' });
      }
    } catch {
      setError('An error occurred. Please try again.');
      toast.error('Login failed', { description: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectConfirm = () => {
    if (!selectedSubject) {
      setError('Please select a subject to continue');
      return;
    }
    const chosen = availableSubjects.find(s => s.courseCode === selectedSubject);
    // Persist active subject into context / localStorage via login callback
    if (pendingLoginData?.setActiveSubject) {
      pendingLoginData.setActiveSubject(chosen);
    } else {
      // fallback: store in localStorage for the dashboard to read
      localStorage.setItem('lms_active_subject', JSON.stringify(chosen));
    }
    toast.success(`Dashboard loaded for ${chosen?.courseName}`, { description: `Semester: ${chosen?.semester}` });
  };

  // ─── SIGNUP ───────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Validation error', { description: 'Passwords do not match' });
      return;
    }
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Validation error', { description: 'Password must be at least 6 characters long' });
      return;
    }
    if (!signupData.employeeId.trim()) {
      setError('Employee ID is required');
      toast.error('Validation error', { description: 'Please enter your employee ID' });
      return;
    }
    if (!signupData.department) {
      setError('Department is required');
      toast.error('Validation error', { description: 'Please select your department' });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...dataToSubmit } = signupData;
      const result = await signup({ ...dataToSubmit, role: 'teacher' });

      if (!result.success) {
        setError(result.message || 'Signup failed');
        toast.error('Signup failed', { description: result.message || 'An error occurred' });
      } else {
        toast.success('Account created!', { description: 'Welcome to EduTrack LMS' });
      }
    } catch {
      setError('An error occurred. Please try again.');
      toast.error('Signup failed', { description: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">

          {/* ── LEFT: Branding ── */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white space-y-6 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">EduTrack LMS</h1>
                <p className="text-emerald-100 text-lg">Faculty Portal</p>
              </div>
            </div>

            <div className="space-y-4 mt-12">
              {[
                { icon: BookOpen,     title: 'Manage Your Classes',  desc: 'Create quizzes, upload materials, and track student progress.' },
                { icon: GraduationCap, title: 'Automated Grading',   desc: 'Save time with automatic quiz grading and performance analytics.' },
                { icon: Users,        title: 'Student Monitoring',   desc: 'Real-time anti-cheating features and performance tracking.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl"
                >
                  <Icon className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-emerald-100">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: Auth card ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">

              {/* ── SUBJECT SELECTION STEP ── */}
              <AnimatePresence mode="wait">
                {subjectStep ? (
                  <motion.div
                    key="subject-step"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Select a Subject</h2>
                      <p className="text-gray-500 text-sm">Choose which subject dashboard to open</p>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
                    )}

                    <div className="space-y-3">
                      {availableSubjects.map((subj) => (
                        <button
                          key={subj.courseCode}
                          type="button"
                          onClick={() => { setSelectedSubject(subj.courseCode); setError(''); }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedSubject === subj.courseCode
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedSubject === subj.courseCode ? 'bg-emerald-500' : 'bg-gray-100'
                            }`}>
                              <Beaker className={`w-5 h-5 ${selectedSubject === subj.courseCode ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{subj.courseName}</p>
                              <p className="text-xs text-gray-500">{subj.courseCode} · {subj.semester}</p>
                            </div>
                            {selectedSubject === subj.courseCode && (
                              <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setSubjectStep(false); setSelectedSubject(''); }}
                        className="flex-1 h-12"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubjectConfirm}
                        disabled={!selectedSubject}
                        className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                      >
                        Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>

                ) : (
                  <motion.div key="auth-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-8">
                      {['Login', 'Sign Up'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => { setIsLogin(tab === 'Login'); setError(''); }}
                          className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
                            (tab === 'Login') === isLogin
                              ? 'bg-white text-emerald-600 shadow-md'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* ── LOGIN FORM ── */}
                    {isLogin ? (
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <p className="text-sm text-emerald-800 font-medium mb-1">👨‍🏫 Faculty Portal</p>
                          <p className="text-xs text-emerald-600">Sign in to access your teaching dashboard</p>
                        </div>

                        <div>
                          <Label htmlFor="login-email" className="text-gray-700 font-medium">Email Address</Label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="faculty@university.edu"
                              value={loginData.email}
                              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                              className="pl-11 h-12 border-gray-300 focus:border-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="login-password" className="text-gray-700 font-medium">Password</Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              id="login-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              value={loginData.password}
                              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                              className="pl-11 pr-11 h-12 border-gray-300 focus:border-emerald-500"
                              required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                            <span className="text-sm text-gray-600">Remember me</span>
                          </label>
                          <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</a>
                        </div>

                        <Button type="submit" disabled={loading}
                          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg">
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Signing in...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">Sign In <ArrowRight className="w-5 h-5" /></span>
                          )}
                        </Button>
                      </form>

                    ) : (
                      /* ── SIGNUP FORM ── */
                      <form onSubmit={handleSignup} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">

                        {/* Row 1: Name + Email */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signup-name" className="text-gray-700 font-medium">Full Name</Label>
                            <div className="relative mt-2">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-name" type="text" placeholder="Dr. John Smith"
                                value={signupData.name}
                                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                className="pl-11 h-11 border-gray-300" required />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email Address</Label>
                            <div className="relative mt-2">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-email" type="email" placeholder="john.smith@university.edu"
                                value={signupData.email}
                                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                className="pl-11 h-11 border-gray-300" required />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Employee ID + Phone */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signup-employeeId" className="text-gray-700 font-medium">Employee ID</Label>
                            <div className="relative mt-2">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-employeeId" type="text" placeholder="FAC202400123"
                                value={signupData.employeeId}
                                onChange={(e) => setSignupData({ ...signupData, employeeId: e.target.value })}
                                className="pl-11 h-11 border-gray-300" required />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="signup-phone" className="text-gray-700 font-medium">Phone Number</Label>
                            <div className="relative mt-2">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-phone" type="tel" placeholder="+1 (555) 000-0000"
                                value={signupData.phone}
                                onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                                className="pl-11 h-11 border-gray-300" required />
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Department + Specialization ← NEW */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signup-department" className="text-gray-700 font-medium">Department</Label>
                            <div className="relative mt-2">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                              <select
                                id="signup-department"
                                value={signupData.department}
                                onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                                className="w-full pl-11 h-11 border border-gray-300 rounded-md bg-white text-sm text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none pr-4"
                                required
                              >
                                <option value="">Select department…</option>
                                {DEPARTMENTS.map(d => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="signup-specialization" className="text-gray-700 font-medium">Specialization</Label>
                            <div className="relative mt-2">
                              <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="signup-specialization"
                                type="text"
                                placeholder="e.g. Machine Learning"
                                value={signupData.specialization}
                                onChange={(e) => setSignupData({ ...signupData, specialization: e.target.value })}
                                className="pl-11 h-11 border-gray-300"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 4: Password + Confirm */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                            <div className="relative mt-2">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                                value={signupData.password}
                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                className="pl-11 pr-11 h-11 border-gray-300" required />
                              <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                            <div className="relative mt-2">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input id="signup-confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password"
                                value={signupData.confirmPassword}
                                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                className="pl-11 h-11 border-gray-300" required />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                          <input type="checkbox" id="terms"
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 mt-1" required />
                          <label htmlFor="terms" className="text-sm text-gray-600">
                            I agree to the <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a> and{' '}
                            <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
                          </label>
                        </div>

                        <Button type="submit" disabled={loading}
                          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg">
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating Account...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">Create Account <ArrowRight className="w-5 h-5" /></span>
                          )}
                        </Button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Need help? Contact{' '}
                <a href="#" className="text-emerald-600 hover:underline font-medium">hr@edutrack.edu</a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
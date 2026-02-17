import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, GraduationCap, Hash, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function StudentAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    phone: '',
    dateOfBirth: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(loginData.email, loginData.password);
      if (!success) {
        setError('Invalid email or password. Please try again.');
        toast.error('Login failed', {
          description: 'Invalid email or password. Please try again.',
        });
      } else {
        toast.success('Login successful!', {
          description: 'Welcome back to EduTrack LMS',
        });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('Login failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Validation error', {
        description: 'Passwords do not match',
      });
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Validation error', {
        description: 'Password must be at least 6 characters long',
      });
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSubmit } = signupData;
      const success = await signup(dataToSubmit);
      
      if (!success) {
        setError('Email already exists. Please login instead.');
        toast.error('Signup failed', {
          description: 'Email already exists. Please login instead.',
        });
      } else {
        toast.success('Account created successfully!', {
          description: 'Welcome to EduTrack LMS',
        });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('Signup failed', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white space-y-6 hidden md:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">EduTrack LMS</h1>
                <p className="text-blue-100 text-lg">Learn. Grow. Succeed.</p>
              </div>
            </div>

            <div className="space-y-4 mt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl"
              >
                <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Interactive Learning</h3>
                  <p className="text-blue-100">Access courses, quizzes, and study materials anytime, anywhere.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl"
              >
                <BookOpen className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Track Your Progress</h3>
                  <p className="text-blue-100">Monitor your performance with real-time analytics and insights.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl"
              >
                <GraduationCap className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Level-Based System</h3>
                  <p className="text-blue-100">Advance through levels based on your quiz performance.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-8">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
                    isLogin
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
                    !isLogin
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Demo Account Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">📌 Demo Account</p>
                    <p className="text-xs text-blue-600">
                      Create a new account or use any email/password for demo purposes
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="login-email" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="student@university.edu"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-11 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="pl-11 pr-11 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                /* Signup Form */
                <form onSubmit={handleSignup} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-name" className="text-gray-700 font-medium">Full Name</Label>
                      <div className="relative mt-2">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className="pl-11 h-11 border-gray-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email Address</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="john@university.edu"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-11 h-11 border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-studentId" className="text-gray-700 font-medium">Student ID</Label>
                      <div className="relative mt-2">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-studentId"
                          type="text"
                          placeholder="STU202400123"
                          value={signupData.studentId}
                          onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })}
                          className="pl-11 h-11 border-gray-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-phone" className="text-gray-700 font-medium">Phone Number</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          className="pl-11 h-11 border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-department" className="text-gray-700 font-medium">Department</Label>
                      <div className="relative mt-2">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <Select
                          value={signupData.department}
                          onValueChange={(value) => setSignupData({ ...signupData, department: value })}
                          required
                        >
                          <SelectTrigger className="pl-11 h-11 border-gray-300">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                            <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                            <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                            <SelectItem value="Business Administration">Business Administration</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-semester" className="text-gray-700 font-medium">Current Semester</Label>
                      <div className="relative mt-2">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <Select
                          value={signupData.semester}
                          onValueChange={(value) => setSignupData({ ...signupData, semester: value })}
                          required
                        >
                          <SelectTrigger className="pl-11 h-11 border-gray-300">
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Semester 1</SelectItem>
                            <SelectItem value="2">Semester 2</SelectItem>
                            <SelectItem value="3">Semester 3</SelectItem>
                            <SelectItem value="4">Semester 4</SelectItem>
                            <SelectItem value="5">Semester 5</SelectItem>
                            <SelectItem value="6">Semester 6</SelectItem>
                            <SelectItem value="7">Semester 7</SelectItem>
                            <SelectItem value="8">Semester 8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-dob" className="text-gray-700 font-medium">Date of Birth</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signup-dob"
                        type="date"
                        value={signupData.dateOfBirth}
                        onChange={(e) => setSignupData({ ...signupData, dateOfBirth: e.target.value })}
                        className="pl-11 h-11 border-gray-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className="pl-11 pr-11 h-11 border-gray-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="signup-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className="pl-11 h-11 border-gray-300"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="terms"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1" 
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
                      <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Need help? Contact{' '}
                <a href="#" className="text-indigo-600 hover:underline font-medium">
                  support@edutrack.edu
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
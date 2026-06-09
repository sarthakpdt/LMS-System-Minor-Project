import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, Hash, ArrowRight,
  Sparkles, Building2, Brain, BookOpen, Beaker, Shield, ChevronRight, Check,
  PenTool, Lightbulb, ClipboardCheck, Users, Award, BarChart3, Settings, TrendingUp, Database, Star, Presentation
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../../theme/components';
import { animationVariants, PageTransition } from '../../theme/animations';

export const DEPARTMENTS = [
  { value: 'CS', label: 'Computer Science & Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'ECE', label: 'Electronics & Communication Engineering' },
  { value: 'EE', label: 'Electrical Engineering' },
  { value: 'ME', label: 'Mechanical Engineering' },
  { value: 'CE', label: 'Civil Engineering' },
  { value: 'CH', label: 'Chemical Engineering' },
  { value: 'BT', label: 'Biotechnology' },
  { value: 'MBA', label: 'Master of Business Administration' },
  { value: 'MCA', label: 'Master of Computer Applications' },
];

const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const BASE = 'http://localhost:5000/api/admin';

// ─── Subject Picker Modal for Teachers ──────────────────────────────────────────
function SubjectPickerModal({ courses, teacherName, onSelect }: {
  courses: any[];
  teacherName: string;
  onSelect: (course: any) => void;
}) {
  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome back, {teacherName}!</h2>
              <p className="text-emerald-100 text-sm mt-0.5">Which subject would you like to manage today?</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">No courses assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">Admin will assign courses to you soon.</p>
              <Button onClick={() => onSelect(null)} className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white">
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-5">
                {courses.map((c: any) => {
                  const id = String(c.courseId || c._id);
                  const isSelected = selected && String(selected.courseId || selected._id) === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(c)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        <BookOpen className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{c.courseName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.courseCode} · Semester {c.semester}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => selected && onSelect(selected)}
                disabled={!selected}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 flex items-center justify-center gap-2 text-base font-semibold"
              >
                Open {selected ? `"${selected.courseName}"` : 'Subject'} Dashboard
                <ChevronRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-center text-gray-400 mt-3">
                You can switch subjects anytime from the sidebar
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function StudentAuthNew() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [error, setError] = useState('');
  const { login, signup, setActiveSubject } = useAuth();

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
  });

  // Teacher courses selection
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Subject picker state for teacher logins
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [loginCourses, setLoginCourses] = useState<any[]>([]);
  const [loginTeacherName, setLoginTeacherName] = useState('');

  // Fetch available courses for teacher signup
  useEffect(() => {
    if (role !== 'teacher' || !signupData.department) {
      setAvailableCourses([]);
      return;
    }
    setLoadingCourses(true);
    fetch(`${BASE}/courses`)
      .then((r) => r.json())
      .then((j) => {
        const all: any[] = j.data || [];
        const filtered = all.filter((c: any) => c.department === signupData.department);
        setAvailableCourses(filtered.length ? filtered : all);
      })
      .catch(() => setAvailableCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [role, signupData.department]);

  const toggleCourse = (id: string) =>
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(loginData.email, loginData.password, role);
      if (result.success) {
        toast.success('Login successful!', {
          description: `Welcome back to the ${role} portal`,
        });
        if (role === 'teacher') {
          const courses: any[] = result.assignedCourses || [];
          const name = result.userName || loginData.email.split('@')[0];

          if (courses.length === 0) {
            navigate('/');
          } else if (courses.length === 1) {
            setActiveSubject({
              courseId: String(courses[0].courseId || courses[0]._id),
              courseCode: courses[0].courseCode,
              courseName: courses[0].courseName,
              semester: courses[0].semester,
            });
            navigate('/');
          } else {
            setLoginCourses(courses);
            setLoginTeacherName(name);
            setShowSubjectPicker(true);
          }
        } else {
          navigate('/');
        }
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
        finalData = {
          ...finalData,
          studentId: signupData.studentId.trim(),
          department: signupData.department,
          semester: signupData.semester,
          phone: signupData.phone.trim(),
        };
      } else if (role === 'teacher') {
        const assignedCourses = availableCourses
          .filter((c) => selectedCourseIds.includes(c._id))
          .map((c) => ({
            courseId: c._id,
            courseCode: c.courseCode,
            courseName: c.courseName,
            semester: c.semester,
          }));

        finalData = {
          ...finalData,
          employeeId: signupData.employeeId.trim(),
          phone: signupData.phone.trim(),
          department: signupData.department,
          specialization: signupData.specialization.trim(),
          assignedCourses,
        };
      } else if (role === 'admin') {
        finalData = {
          ...finalData,
          employeeId: signupData.employeeId.trim(),
          phone: signupData.phone.trim(),
        };
      }

      const result = await signup(finalData);

      if (result.success) {
        if (result.pending) {
          toast.success('Account created!', {
            description: 'Your account is pending admin approval.',
            duration: 4000,
          });
          setIsLogin(true);
        } else {
          toast.success('Account created!', {
            description: 'Redirecting...',
            duration: 2000,
          });
          setTimeout(() => navigate('/'), 500);
        }
      } else {
        setError(result.message || 'Registration failed');
        toast.error('Registration failed', { description: result.message });
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Subject selected handler (teacher login with multiple courses) ────────
  const handleSubjectSelected = (course: any) => {
    if (course) {
      setActiveSubject({
        courseId: String(course.courseId || course._id),
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
      });
    }
    setShowSubjectPicker(false);
    navigate('/');
  };

  // Color config mapping by role for dynamic visual feedback
  const roleThemes = {
    student: {
      accent: 'blue',
      focusRing: 'focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400',
      gradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 shadow-blue-500/25',
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'shadow-glow-blue',
      icon: GraduationCap,
      label: 'Student',
      bgGradient: 'from-blue-600 via-cyan-500 to-indigo-600',
      bgGradientDark: 'dark:from-blue-900 dark:via-cyan-900 dark:to-indigo-950',
      heroImage: '/illustrations/student-hero.png',
      headline: 'Welcome Back, Student',
      subtitle: 'Continue Your Learning Journey',
      tagline: 'Track Progress, Complete Assignments, Achieve More',
      floatingIcons: [BookOpen, GraduationCap, Brain, Beaker, PenTool, Lightbulb],
    },
    teacher: {
      accent: 'emerald',
      focusRing: 'focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400',
      gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 shadow-emerald-500/25',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-glow-green',
      icon: Beaker,
      label: 'Teacher',
      bgGradient: 'from-green-600 via-emerald-500 to-teal-600',
      bgGradientDark: 'dark:from-green-900 dark:via-emerald-900 dark:to-teal-950',
      heroImage: '/illustrations/teacher-hero.png',
      headline: 'Welcome Back, Educator',
      subtitle: 'Inspire, Teach, and Guide',
      tagline: 'Manage Courses and Empower Students',
      floatingIcons: [BookOpen, Presentation, ClipboardCheck, Users, Star, Award],
    },
    admin: {
      accent: 'purple',
      focusRing: 'focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400',
      gradient: 'from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 dark:from-purple-500 dark:to-violet-500 shadow-purple-500/25',
      text: 'text-purple-600 dark:text-purple-400',
      glow: 'shadow-glow-purple',
      icon: Shield,
      label: 'Admin',
      bgGradient: 'from-purple-600 via-violet-500 to-indigo-600',
      bgGradientDark: 'dark:from-purple-900 dark:via-violet-900 dark:to-indigo-950',
      heroImage: '/illustrations/admin-hero.png',
      headline: 'Welcome Back, Administrator',
      subtitle: 'Manage and Monitor Your Institution',
      tagline: 'Control, Analyze, and Lead',
      floatingIcons: [BarChart3, Shield, Settings, Users, Database, TrendingUp],
    },
  };

  const currentTheme = roleThemes[role];

  // Floating icon positions (fixed, pre-computed for 6 icons)
  const iconPositions = [
    { top: '8%', left: '6%', delay: 0, duration: 6, size: 28 },
    { top: '18%', right: '8%', delay: 1.2, duration: 7, size: 22 },
    { bottom: '22%', left: '4%', delay: 0.6, duration: 8, size: 24 },
    { bottom: '12%', right: '6%', delay: 1.8, duration: 5.5, size: 26 },
    { top: '45%', left: '3%', delay: 2.4, duration: 7.5, size: 20 },
    { top: '60%', right: '4%', delay: 0.3, duration: 6.5, size: 22 },
  ];

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* ── Role-Specific Animated Gradient Background ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${role}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 bg-gradient-to-br ${currentTheme.bgGradient} ${currentTheme.bgGradientDark}`}
          style={{ backgroundSize: '400% 400%', animation: 'ds-gradient-shift 12s ease infinite' }}
        />
      </AnimatePresence>

      {/* ── Floating Orbs (ambient glow, role-colored) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <motion.div
          animate={{ x: [0, 80, -50, 0], y: [0, -70, 80, 0], scale: [1, 1.15, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px]"
          style={{ top: '-10%', left: '-5%' }}
        />
        <motion.div
          animate={{ x: [0, -80, 60, 0], y: [0, 80, -60, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[120px]"
          style={{ bottom: '-15%', right: '-5%' }}
        />
      </div>

      {/* ── Floating Role-Specific SVG Icons ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`icons-${role}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {currentTheme.floatingIcons.map((Icon, i) => {
              const pos = iconPositions[i];
              return (
                <motion.div
                  key={i}
                  className="absolute text-white/[0.12] dark:text-white/[0.08]"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    right: pos.right,
                    bottom: pos.bottom,
                  }}
                  animate={{
                    y: [0, -18, 0, 12, 0],
                    rotate: [0, 5, -3, 5, 0],
                  }}
                  transition={{
                    duration: pos.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: pos.delay,
                  }}
                >
                  <Icon size={pos.size} strokeWidth={1.5} />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Hero Illustration (behind card, reduced opacity) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={`hero-${role}`}
            src={currentTheme.heroImage}
            alt={`${role} illustration`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.85, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="max-w-[700px] max-h-[85vh] w-auto h-auto object-contain select-none"
            style={{ filter: 'saturate(0.6) brightness(1.2)' }}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSubjectPicker && (
          <SubjectPickerModal
            courses={loginCourses}
            teacherName={loginTeacherName}
            onSelect={handleSubjectSelected}
          />
        )}
      </AnimatePresence>

      {/* Main Card Wrapper — stays in exact same position */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full relative z-10 flex flex-col items-center justify-center"
      >
        <Card
          glass
          noPadding
          hover={false}
          className={`w-full max-w-md ${!isLogin && (role === 'student' || role === 'teacher') ? 'md:max-w-2xl' : 'md:max-w-md'} shadow-2xl p-6 md:p-8 backdrop-blur-2xl border border-white/25 dark:border-white/10 bg-white/80 dark:bg-gray-900/75 transition-all duration-300 ${currentTheme.glow}`}
        >
          {/* Header Branding — now role-aware messaging */}
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              layout
              className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${currentTheme.gradient} text-white mb-3 shadow-lg`}
            >
              <currentTheme.icon className="w-7 h-7" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`heading-${role}-${isLogin}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <h1 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-1.5 justify-center">
                  <span>EduTrack LMS</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 font-semibold border border-gray-200/50 dark:border-gray-700/50 ${currentTheme.text}`}>
                    {currentTheme.label}
                  </span>
                </h1>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1.5">
                  {isLogin ? currentTheme.headline : `Create a new ${role} account`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {isLogin ? currentTheme.subtitle : currentTheme.tagline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Role Segment Selector (Floating Slider Animation) */}
          <div className="relative flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-6 border border-gray-200/50 dark:border-gray-700/50">
            {(['student', 'teacher', 'admin'] as const).map((r) => {
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setError('');
                  }}
                  className={`relative flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg z-10 transition-colors ${
                    isActive ? 'text-gray-950 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoleSlider"
                      className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {r.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Auth Mode Toggle (Login vs Register) */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isLogin
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                !isLogin
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error" className="mb-5 animate-pulse" title="Error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Forms */}
          {isLogin ? (
            <motion.form
              key="loginForm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="name@university.edu"
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r shadow-lg hover:shadow-xl transform active:scale-[0.98] disabled:opacity-50 z-10 relative cursor-pointer ${currentTheme.gradient}`}
              >
                {loading ? 'Authenticating...' : `Sign In as ${currentTheme.label}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signupForm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSignup}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                      required
                    />
                  </div>
                </div>

                {/* ID Fields based on role */}
                {role === 'student' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Student ID *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={signupData.studentId}
                        onChange={(e) => setSignupData({ ...signupData, studentId: e.target.value })}
                        placeholder="2024CS001"
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Employee ID *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={signupData.employeeId}
                        onChange={(e) => setSignupData({ ...signupData, employeeId: e.target.value })}
                        placeholder="EMP2024001"
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="email@university.edu"
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Department & Semester selections */}
              {role !== 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Department *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <select
                        value={signupData.department}
                        onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white appearance-none ${currentTheme.focusRing}`}
                        required
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Semester */}
                  {role === 'student' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Semester *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                        <select
                          value={signupData.semester}
                          onChange={(e) => setSignupData({ ...signupData, semester: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white appearance-none ${currentTheme.focusRing}`}
                          required
                        >
                          <option value="">Select Semester</option>
                          {SEMESTERS.map((sem) => (
                            <option key={sem} value={sem}>
                              Semester {sem}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Teacher Specialization */}
                  {role === 'teacher' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Specialization
                      </label>
                      <div className="relative">
                        <Beaker className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={signupData.specialization}
                          onChange={(e) => setSignupData({ ...signupData, specialization: e.target.value })}
                          placeholder="e.g. Artificial Intelligence"
                          className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Courses list for teacher signup */}
              {role === 'teacher' && signupData.department && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Courses you will teach
                  </label>
                  {loadingCourses ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-xs text-gray-400">
                      Loading courses...
                    </div>
                  ) : availableCourses.length === 0 ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-xl text-xs text-yellow-700 dark:text-yellow-400">
                      No courses found in this department. Admin will assign courses manually.
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-800/40">
                      {availableCourses.map((c) => {
                        const isSelected = selectedCourseIds.includes(c._id);
                        return (
                          <label
                            key={c._id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCourse(c._id)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {c.courseName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {c.courseCode} · Sem {c.semester}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all bg-white ${currentTheme.focusRing}`}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r shadow-lg hover:shadow-xl transform active:scale-[0.98] disabled:opacity-50 z-10 relative cursor-pointer ${currentTheme.gradient}`}
              >
                {loading ? 'Creating Account...' : `Register as ${currentTheme.label}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {/* Footer Terms */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </Card>
      </motion.div>
    </PageTransition>
  );
}

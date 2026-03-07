import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Hash, BookOpen, Eye, EyeOff, Beaker, Building2, GraduationCap, Sparkles, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useNavigate } from 'react-router-dom';

export const DEPARTMENTS = [
  { value: 'CS',  label: 'Computer Science & Engineering' },
  { value: 'IT',  label: 'Information Technology' },
  { value: 'ECE', label: 'Electronics & Communication Engineering' },
  { value: 'EE',  label: 'Electrical Engineering' },
  { value: 'ME',  label: 'Mechanical Engineering' },
  { value: 'CE',  label: 'Civil Engineering' },
  { value: 'CH',  label: 'Chemical Engineering' },
  { value: 'BT',  label: 'Biotechnology' },
  { value: 'MBA', label: 'Master of Business Administration' },
  { value: 'MCA', label: 'Master of Computer Applications' },
];

const BASE = 'http://localhost:5000/api/admin';

// ─── Subject Picker Modal ─────────────────────────────────────────────────────
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
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
              <p className="text-gray-600 font-medium">No courses assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">Admin will assign courses to you soon.</p>
              <Button onClick={() => onSelect(null)} className="mt-5 bg-emerald-600 hover:bg-emerald-700">
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
                        isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500' : 'bg-emerald-100'}`}>
                        <BookOpen className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.courseName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.courseCode} · Semester {c.semester}</p>
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
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2 text-base"
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

// ─── Main TeacherAuth ─────────────────────────────────────────────────────────
export function TeacherAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, setActiveSubject } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    employeeId: '', phone: '', department: '', specialization: '',
  });

  // Subject picker after login
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [loginCourses, setLoginCourses] = useState<any[]>([]);
  const [loginTeacherName, setLoginTeacherName] = useState('');

  // Courses for signup
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (!signupData.department) { setAvailableCourses([]); return; }
    setLoadingCourses(true);
    fetch(`${BASE}/courses`)
      .then(r => r.json())
      .then(j => {
        const all: any[] = j.data || [];
        const filtered = all.filter((c: any) => c.department === signupData.department);
        setAvailableCourses(filtered.length ? filtered : all);
      })
      .catch(() => setAvailableCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [signupData.department]);

  const toggleCourse = (id: string) =>
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(loginData.email, loginData.password, 'teacher');
      if (result.success) {
        toast.success('Login successful!');
        const courses: any[] = result.assignedCourses || [];
        const name = result.userName || loginData.email.split('@')[0];

        if (courses.length === 0) {
          navigate('/');
        } else if (courses.length === 1) {
          // Auto-select single course
          setActiveSubject({
            courseId: String(courses[0].courseId || courses[0]._id),
            courseCode: courses[0].courseCode,
            courseName: courses[0].courseName,
            semester: courses[0].semester,
          });
          navigate('/');
        } else {
          // Show picker for multiple courses
          setLoginCourses(courses);
          setLoginTeacherName(name);
          setShowSubjectPicker(true);
        }
      } else {
        setError(result.message || 'Invalid credentials');
        toast.error('Login failed', { description: result.message });
      }
    } catch { setError('An error occurred.'); }
    finally { setLoading(false); }
  };

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

  // ── Signup ────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (signupData.password !== signupData.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.employeeId || !signupData.phone || !signupData.department) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      const assignedCourses = availableCourses
        .filter(c => selectedCourseIds.includes(c._id))
        .map(c => ({ courseId: c._id, courseCode: c.courseCode, courseName: c.courseName, semester: c.semester }));

      const result = await signup({
        name: signupData.name.trim(), email: signupData.email.trim(),
        password: signupData.password, role: 'teacher',
        employeeId: signupData.employeeId.trim(), phone: signupData.phone.trim(),
        department: signupData.department, specialization: signupData.specialization.trim(),
        assignedCourses,
      });

      if (result.success) {
        toast.success('Account created!', { description: 'Redirecting...', duration: 2000 });
        setTimeout(() => navigate('/'), 500);
      } else {
        setError(result.message || 'Signup failed');
        toast.error('Signup failed', { description: result.message });
      }
    } catch { setError('An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <AnimatePresence>
        {showSubjectPicker && (
          <SubjectPickerModal
            courses={loginCourses}
            teacherName={loginTeacherName}
            onSelect={handleSubjectSelected}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ top: '10%', left: '10%' }} />
        </div>

        <div className="w-full max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="text-white space-y-6 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">EduTrack LMS</h1>
                  <p className="text-emerald-100 text-lg">Faculty Portal</p>
                </div>
              </div>
              <div className="space-y-4 mt-12">
                <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                  <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Multi-Subject Management</h3>
                    <p className="text-emerald-100">Switch between subjects seamlessly from your dashboard.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-8">
                  <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-600'}`}>Login</button>
                  <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-600'}`}>Sign Up</button>
                </div>

                {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <Label>Email Address</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input type="email" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} className="pl-11 h-12" required />
                      </div>
                    </div>
                    <div>
                      <Label>Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} className="pl-11 pr-11 h-12" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
                      {loading ? 'Signing in...' : 'Sign In as Faculty'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} className="pl-11 h-11" placeholder="Dr. John Smith" required />
                        </div>
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input type="email" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} className="pl-11 h-11" required />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Employee ID</Label>
                        <div className="relative mt-2">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input value={signupData.employeeId} onChange={e => setSignupData({ ...signupData, employeeId: e.target.value })} className="pl-11 h-11" placeholder="EMP2024001" required />
                        </div>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input type="tel" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} className="pl-11 h-11" required />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Department</Label>
                        <div className="relative mt-2">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                          <select value={signupData.department} onChange={e => setSignupData({ ...signupData, department: e.target.value })}
                            className="w-full pl-11 h-11 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none" required>
                            <option value="">Select department…</option>
                            {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Specialization</Label>
                        <div className="relative mt-2">
                          <Beaker className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input placeholder="e.g. Machine Learning" value={signupData.specialization} onChange={e => setSignupData({ ...signupData, specialization: e.target.value })} className="pl-11 h-11" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" /> Courses you will teach
                        {signupData.department && <span className="text-xs text-gray-400 font-normal">(showing {signupData.department} courses)</span>}
                      </Label>
                      {!signupData.department ? (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">Select your department first.</div>
                      ) : loadingCourses ? (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">Loading courses...</div>
                      ) : availableCourses.length === 0 ? (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">No courses yet. Admin will assign after approval.</div>
                      ) : (
                        <div className="mt-2 grid gap-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                          {availableCourses.map(c => (
                            <label key={c._id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors ${selectedCourseIds.includes(c._id) ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-emerald-200'}`}>
                              <input type="checkbox" checked={selectedCourseIds.includes(c._id)} onChange={() => toggleCourse(c._id)} className="w-4 h-4 text-emerald-600 rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{c.courseName}</p>
                                <p className="text-xs text-gray-500">{c.courseCode} · Sem {c.semester}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      {selectedCourseIds.length > 0 && <p className="text-xs text-emerald-600 mt-1">{selectedCourseIds.length} course(s) selected</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input type="password" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} className="pl-11 h-11" required />
                        </div>
                      </div>
                      <div>
                        <Label>Confirm Password</Label>
                        <div className="relative mt-2">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input type="password" value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} className="pl-11 h-11" required />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 mt-2">
                      {loading ? 'Creating Account...' : 'Create Faculty Account'}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
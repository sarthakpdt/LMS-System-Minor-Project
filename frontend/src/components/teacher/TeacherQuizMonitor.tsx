import { useParams, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Camera, Monitor, AlertTriangle, CheckCircle, Clock, User, Eye, BookOpen } from 'lucide-react';

interface StudentRow {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  semester?: string;
  department?: string;
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
  enrolledStudents?: StudentRow[];
}

interface Attempt {
  _id: string;
  studentId: StudentRow | string;
  score: number;
  totalMarks: number;
  percentage: number;
  effectiveScore?: number;
  effectivePercentage?: number;
  submittedAt?: string;
  createdAt?: string;
  timeTaken?: number;
  violationCount?: number;
  hasViolation?: boolean;
  hasHighSeverityViolation?: boolean;
  violationTag?: 'VIOLATED' | 'CLEAN';
  studentDisplayName?: string;
  teacherReview?: {
    action?: 'none' | 'warning' | 'zero_marks' | 'custom_marks';
    customMarks?: number;
    note?: string;
    reviewedAt?: string;
  };
  plagiarismEvents?: Array<{ type: string; severity: 'low' | 'medium' | 'high'; timestamp?: string }>;
}

const API = 'http://localhost:5000';

export function TeacherQuizMonitor() {
  const { id } = useParams();
  const { user } = useAuth();

  const [students, setStudents]           = useState<StudentRow[]>([]);
  const [courses, setCourses]             = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading]             = useState(true);
  const [quizTitle, setQuizTitle]         = useState('');
  const [attempts, setAttempts]           = useState<Attempt[]>([]);
  const [savingReview, setSavingReview]   = useState<Record<string, boolean>>({});
  const [reviewNotes, setReviewNotes]     = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) loadTeacherData();
  }, [user, id]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // ── Step 1: get this teacher's assigned course IDs ─────────────────
      const profileRes = await fetch(`${API}/api/admin/teachers/${user!.id}`, {
        headers: { Authorization: `Bearer ${user!.token}` },
      });

      let assignedCourseIds: string[] = [];

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const teacher = profileData.data || profileData;
        if (teacher.assignedCourses?.length) {
          assignedCourseIds = teacher.assignedCourses.map(
            (c: any) => String(c.courseId || c._id || c)
          );
        }
      }

      // Fall back to assignedCourses from AuthContext (populated at login)
      if (assignedCourseIds.length === 0 && user!.assignedCourses?.length) {
        assignedCourseIds = user!.assignedCourses.map((c: any) => String(c.courseId || c._id));
      }

      if (assignedCourseIds.length === 0) {
        setStudents([]);
        setCourses([]);
        setLoading(false);
        return;
      }

      // ── Step 2: fetch all courses, keep only assigned ones ─────────────
      const allCoursesRes = await fetch(`${API}/api/courses`);
      const allCourses: Course[] = await allCoursesRes.json();
      const teacherCourses = allCourses.filter(c =>
        assignedCourseIds.includes(String(c._id))
      );
      setCourses(teacherCourses);

      // ── Step 3: collect unique enrolled students across all assigned courses
      const studentMap = new Map<string, StudentRow>();
      for (const course of teacherCourses) {
        (course.enrolledStudents || []).forEach((s: any) => {
          if (s && s._id) studentMap.set(String(s._id), s);
        });
      }

      // If enrolledStudents were not populated, fall back to approved students
      // filtered by teacher's assignedStudents list
      if (studentMap.size === 0) {
        const approvedRes = await fetch(`${API}/api/admin/students/approved`, {
          headers: { Authorization: `Bearer ${user!.token}` },
        });
        if (approvedRes.ok) {
          const approvedData = await approvedRes.json();
          const allStudents: StudentRow[] = approvedData.data || [];

          // Get teacher's assignedStudents list from profile
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const teacher = profileData.data || profileData;
            if (teacher.assignedStudents?.length) {
              const assignedIds = new Set(
                teacher.assignedStudents.map((s: any) => String(s._id || s))
              );
              allStudents
                .filter(s => assignedIds.has(String(s._id)))
                .forEach(s => studentMap.set(String(s._id), s));
            } else {
              // last resort: show students whose semester matches teacher's courses
              const courseSemesters = new Set(teacherCourses.map((c: any) => c.semester));
              allStudents
                .filter(s => s.semester && courseSemesters.has(s.semester))
                .forEach(s => studentMap.set(String(s._id), s));
            }
          }
        }
      }

      setStudents(Array.from(studentMap.values()));

      // ── Step 4: fetch quiz title if id provided ────────────────────────
      if (id) {
        try {
          const qRes = await fetch(`${API}/api/quizzes/${id}`);
          if (qRes.ok) {
            const q = await qRes.json();
            setQuizTitle(q.title || '');
          }
        } catch { /* optional */ }

        try {
          const attemptsRes = await fetch(`${API}/api/quizzes/${id}/attempts`);
          if (attemptsRes.ok) {
            const attemptsData: Attempt[] = await attemptsRes.json();
            setAttempts(attemptsData || []);
          } else {
            setAttempts([]);
          }
        } catch {
          setAttempts([]);
        }
      }
    } catch (err) {
      console.error('Failed to load quiz monitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students by selected course
  const displayedStudents = (() => {
    if (selectedCourse === 'all') return students;
    const course = courses.find(c => c._id === selectedCourse);
    if (!course?.enrolledStudents?.length) return students;
    const ids = new Set(course.enrolledStudents.map((s: any) => String(s._id)));
    return students.filter(s => ids.has(String(s._id)));
  })();

  const attemptsByStudent = attempts.reduce<Record<string, Attempt>>((acc, attempt) => {
    const sid = typeof attempt.studentId === 'string' ? attempt.studentId : attempt.studentId?._id;
    if (sid) acc[String(sid)] = attempt;
    return acc;
  }, {});

  const totalViolations = attempts.reduce((sum, a) => sum + (a.plagiarismEvents?.length || 0), 0);
  const totalHighViolations = attempts.reduce(
    (sum, a) => sum + (a.plagiarismEvents?.filter(e => e.severity === 'high').length || 0),
    0
  );
  const submittedCount = attempts.length;
  const cleanCount = attempts.filter(a => (a.plagiarismEvents?.length || 0) === 0).length;
  const avgTimeMinutes = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length / 60)
    : null;

  const saveTeacherReview = async (
    attempt: Attempt,
    action: 'none' | 'warning' | 'zero_marks' | 'custom_marks',
    customMarks?: number,
    note?: string
  ) => {
    if (!id || !user?.token) return;
    if (action === 'custom_marks' && (typeof customMarks !== 'number' || Number.isNaN(customMarks))) {
      alert('Please enter valid custom marks.');
      return;
    }

    const attemptId = attempt._id;
    setSavingReview(prev => ({ ...prev, [attemptId]: true }));
    try {
      const res = await fetch(`${API}/api/quizzes/${id}/attempts/${attemptId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          action,
          customMarks,
          note: typeof note === 'string' ? note : (reviewNotes[attemptId] ?? attempt.teacherReview?.note ?? ''),
          reviewedBy: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || 'Failed to save review');
        return;
      }

      setAttempts(prev => prev.map(a => {
        if (a._id !== attemptId) return a;
        return {
          ...a,
          teacherReview: data.teacherReview,
          effectiveScore: data.effectiveScore,
          effectivePercentage: data.effectivePercentage,
        };
      }));
      setReviewNotes(prev => ({
        ...prev,
        [attemptId]: data?.teacherReview?.note ?? prev[attemptId] ?? '',
      }));
    } catch {
      alert('Failed to save review. Please try again.');
    } finally {
      setSavingReview(prev => ({ ...prev, [attemptId]: false }));
    }
  };

  const actionLabel = (action?: string) => {
    if (action === 'warning') return 'Warning';
    if (action === 'zero_marks') return 'Zero Marks';
    if (action === 'custom_marks') return 'Custom Marks';
    return 'No Action';
  };

  return (
    <div className="p-8">
      <Link to="/quizzes" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Quiz Management
      </Link>

      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-[1rem] flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Live Quiz Monitoring</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">
            Real-time monitoring of quiz attempts with anti-cheating detection.
            {quizTitle && <span className="ml-2 font-medium text-gray-800 dark:text-gray-300">— {quizTitle}</span>}
          </p>
        </div>
      </div>

      {/* Quiz Info Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-[1.5rem] p-8 mb-10 text-white shadow-lg hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{quizTitle || 'Quiz Monitor'}</h3>
            <p className="text-green-100">
              {courses.length > 0
                ? courses.map(c => `${c.courseName} (${c.courseCode})`).join(', ')
                : 'Your assigned courses'}
            </p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm dark:bg-slate-800 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            Active Now
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-100 mb-1">My Courses</p>
            <p className="text-2xl font-bold">{courses.length}</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">My Students</p>
            <p className="text-2xl font-bold">{students.length}</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Shown</p>
            <p className="text-2xl font-bold">{displayedStudents.length}</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Flagged</p>
            <p className="text-2xl font-bold text-yellow-300">{totalHighViolations}</p>
          </div>
        </div>
      </div>

      {/* Monitoring Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="bg-white rounded-[1.5rem] p-8 border border-gray-200/80 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tab Switches</p>
              <p className="text-2xl font-bold text-red-600">{totalViolations}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total detected violations</p>
        </div>

        <div className="bg-white rounded-[1.5rem] p-8 border border-gray-200/80 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Face Not Detected</p>
              <p className="text-2xl font-bold text-purple-600">{totalHighViolations}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">AI proctoring alerts</p>
        </div>

        <div className="bg-white rounded-[1.5rem] p-8 border border-gray-200/80 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clean Records</p>
              <p className="text-2xl font-bold text-green-600">{cleanCount}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">No violations detected</p>
        </div>

        <div className="bg-white rounded-[1.5rem] p-8 border border-gray-200/80 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-orange-600">{avgTimeMinutes !== null ? `${avgTimeMinutes}m` : '—'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Time tracker</p>
        </div>
      </div>

      {/* Course filter tabs */}
      {courses.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCourse === 'all'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            All Courses ({students.length})
          </button>
          {courses.map(c => (
            <button
              key={c._id}
              onClick={() => setSelectedCourse(c._id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCourse === c._id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              {c.courseCode} ({(c.enrolledStudents || []).length})
            </button>
          ))}
        </div>
      )}

      {/* Student Monitoring Table */}
      <div className="bg-white rounded-[1.5rem] border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Student Submission Review</h3>
          <span className="text-sm text-gray-500">{submittedCount} submission{submittedCount !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading your students...
          </div>
        ) : displayedStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No students found</p>
            <p className="text-sm mt-1">
              {courses.length === 0
                ? 'No courses are assigned to your account yet.'
                : 'No enrolled students in your assigned courses.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Violations</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedStudents.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    {(() => {
                      const attempt = attemptsByStudent[String(student._id)];
                      const violationCount = attempt?.plagiarismEvents?.length || 0;
                      const hasHighViolation = (attempt?.plagiarismEvents || []).some(e => e.severity === 'high');
                      const isViolated = Boolean(attempt?.hasViolation ?? (violationCount > 0));
                      const studentName = attempt?.studentDisplayName || (isViolated ? `Violated - ${student.name}` : student.name);
                      const reviewAction = attempt?.teacherReview?.action || 'none';
                      const selectedCustomMarks = attempt?.teacherReview?.customMarks;
                      const noteDraft = attempt ? (reviewNotes[attempt._id] ?? attempt.teacherReview?.note ?? '') : '';
                      return (
                        <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <p className={`font-medium ${isViolated ? 'text-red-700' : 'text-gray-900'}`}>{studentName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{student.studentId || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {student.semester ? `Sem ${student.semester}` : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {attempt ? (
                        <p className="text-sm font-medium text-gray-800">
                          {(typeof attempt.effectiveScore === 'number' ? attempt.effectiveScore : attempt.score)}/{attempt.totalMarks}
                          {' '}
                          (
                          {typeof attempt.effectivePercentage === 'number' ? attempt.effectivePercentage : attempt.percentage}
                          %)
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Not submitted</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {attempt?.submittedAt || attempt?.createdAt
                          ? new Date(attempt.submittedAt || attempt.createdAt || '').toLocaleString('en-IN')
                          : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        violationCount === 0
                          ? 'bg-green-100 text-green-700'
                          : hasHighViolation
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {violationCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {!attempt ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <div className="space-y-2">
                          {violationCount === 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" /> Clean
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              hasHighViolation ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          )}

                          {isViolated && (
                            <div className="space-y-1">
                              <select
                                value={reviewAction}
                                onChange={e => {
                                  const newAction = e.target.value as 'none' | 'warning' | 'zero_marks' | 'custom_marks';
                                  const customMarks = newAction === 'custom_marks'
                                    ? (typeof selectedCustomMarks === 'number' ? selectedCustomMarks : attempt.score)
                                    : undefined;
                                  saveTeacherReview(attempt, newAction, customMarks, noteDraft);
                                }}
                                disabled={!!savingReview[attempt._id]}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="none">No Action</option>
                                <option value="warning">Warning</option>
                                <option value="zero_marks">Zero Marks</option>
                                <option value="custom_marks">Custom Marks</option>
                              </select>

                              {reviewAction === 'custom_marks' && (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={attempt.totalMarks}
                                    step={0.25}
                                    defaultValue={typeof selectedCustomMarks === 'number' ? selectedCustomMarks : attempt.score}
                                    onBlur={e => {
                                      const marks = Number(e.target.value);
                                      saveTeacherReview(attempt, 'custom_marks', marks, noteDraft);
                                    }}
                                    disabled={!!savingReview[attempt._id]}
                                    className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
                                  />
                                  <span className="text-xs text-gray-500">/ {attempt.totalMarks}</span>
                                </div>
                              )}

                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={noteDraft}
                                  onChange={e => setReviewNotes(prev => ({ ...prev, [attempt._id]: e.target.value }))}
                                  placeholder="Add review note..."
                                  disabled={!!savingReview[attempt._id]}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveTeacherReview(
                                    attempt,
                                    reviewAction as 'none' | 'warning' | 'zero_marks' | 'custom_marks',
                                    reviewAction === 'custom_marks' ? selectedCustomMarks : undefined,
                                    noteDraft
                                  )}
                                  disabled={!!savingReview[attempt._id]}
                                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-60"
                                >
                                  {savingReview[attempt._id] ? 'Saving...' : 'Save Note'}
                                </button>
                              </div>

                              {attempt.teacherReview?.reviewedAt && (
                                <div className="text-[11px] leading-4 text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 mr-1">Reviewed</span>
                                  Action: {actionLabel(attempt.teacherReview?.action)}
                                  {typeof attempt.effectiveScore === 'number' && (
                                    <> | Marks: {attempt.effectiveScore}/{attempt.totalMarks}</>
                                  )}
                                  {' '}| {new Date(attempt.teacherReview.reviewedAt).toLocaleString('en-IN')}
                                  {attempt.teacherReview?.note?.trim() ? ` | Note: ${attempt.teacherReview.note}` : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
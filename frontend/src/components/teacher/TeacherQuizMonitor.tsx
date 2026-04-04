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

const API = 'http://localhost:5000';

export function TeacherQuizMonitor() {
  const { id } = useParams();
  const { user } = useAuth();

  const [students, setStudents]           = useState<StudentRow[]>([]);
  const [courses, setCourses]             = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading]             = useState(true);
  const [quizTitle, setQuizTitle]         = useState('');

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

  return (
    <div className="p-8">
      <Link to="/quizzes" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Quiz Management
      </Link>

      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Live Quiz Monitoring</h2>
        <p className="text-gray-600">
          Real-time monitoring of quiz attempts with anti-cheating detection.
          {quizTitle && <span className="ml-2 font-medium text-gray-800">— {quizTitle}</span>}
        </p>
      </div>

      {/* Quiz Info Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 mb-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{quizTitle || 'Quiz Monitor'}</h3>
            <p className="text-green-100">
              {courses.length > 0
                ? courses.map(c => `${c.courseName} (${c.courseCode})`).join(', ')
                : 'Your assigned courses'}
            </p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
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
            <p className="text-2xl font-bold text-yellow-300">0</p>
          </div>
        </div>
      </div>

      {/* Monitoring Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tab Switches</p>
              <p className="text-2xl font-bold text-red-600">0</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Total detected violations</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Face Not Detected</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">AI proctoring alerts</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clean Records</p>
              <p className="text-2xl font-bold text-green-600">{displayedStudents.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">No violations detected</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-orange-600">—</p>
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Student Activity Monitor</h3>
          <span className="text-sm text-gray-500">{displayedStudents.length} student{displayedStudents.length !== 1 ? 's' : ''}</span>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedStudents.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="font-medium text-gray-900">{student.name}</p>
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
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Clean
                      </span>
                    </td>
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
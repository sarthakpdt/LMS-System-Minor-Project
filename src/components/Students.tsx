import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Download, Award, Target, TrendingUp } from 'lucide-react';

export function Students() {
  const { user } = useAuth();
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Fetch all approved students
        const studRes = await fetch('http://localhost:5000/api/admin/students/approved');
        if (!studRes.ok) return;
        const studJson = await studRes.json();
        let students: any[] = studJson.data || [];

        // 2. If teacher — fetch their profile to get assignedCourses & assignedStudents
        if (user?.role === 'teacher' && user.id) {
          const token = user.token;
          const profRes = await fetch(`http://localhost:5000/api/admin/teachers/${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (profRes.ok) {
            const profJson = await profRes.json();
            const teacher = profJson.data || {};

            // Store courses so we can show the course filter dropdown
            const courses = teacher.assignedCourses || user.assignedCourses || [];
            setTeacherCourses(courses);

            // Filter students to only those assigned to this teacher
            if (teacher.assignedStudents && teacher.assignedStudents.length > 0) {
              const ids = new Set(teacher.assignedStudents.map((s: any) => String(s._id || s)));
              students = students.filter((s: any) => ids.has(String(s._id)));
            }
          } else {
            // Fallback: use assignedCourses from JWT/localStorage user
            setTeacherCourses(user.assignedCourses || []);
          }
        }

        setAllStudents(students);
      } catch (err) {
        console.warn('Failed to load students list', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredStudents = allStudents.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = filterLevel === 'all' || student.level === filterLevel;

    // If teacher has selected a specific course, show only students enrolled in it
    const matchesCourse =
      selectedCourse === 'all' ||
      (student.enrolledCourses || []).some(
        (c: any) => (c.courseId || c.courseCode) === selectedCourse
      );

    return matchesSearch && matchesLevel && matchesCourse;
  });

  const levelCounts = {
    Advanced: allStudents.filter((s) => s.level === 'Advanced').length,
    Intermediate: allStudents.filter((s) => s.level === 'Intermediate').length,
    Beginner: allStudents.filter((s) => s.level === 'Beginner').length,
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Advanced':     return 'bg-green-100 text-green-700 border border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Beginner':     return 'bg-orange-100 text-orange-700 border border-orange-200';
      default:             return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {isTeacher ? 'My Students' : 'Students by Performance Level'}
        </h2>
        <p className="text-gray-600">
          {isTeacher
            ? 'Students enrolled in your courses, grouped by performance level.'
            : 'Automatic level assignment and promotion based on consistent performance.'}
        </p>
      </div>

      {/* ── Level Distribution Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">82–100%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Advanced Level</p>
          <p className="text-4xl font-bold">{levelCounts.Advanced}</p>
          <p className="text-xs opacity-75 mt-2">{allStudents.length > 0 ? ((levelCounts.Advanced / allStudents.length) * 100).toFixed(0) : 0}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">66–81%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Intermediate Level</p>
          <p className="text-4xl font-bold">{levelCounts.Intermediate}</p>
          <p className="text-xs opacity-75 mt-2">{allStudents.length > 0 ? ((levelCounts.Intermediate / allStudents.length) * 100).toFixed(0) : 0}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">0–65%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Beginner Level</p>
          <p className="text-4xl font-bold">{levelCounts.Beginner}</p>
          <p className="text-xs opacity-75 mt-2">{allStudents.length > 0 ? ((levelCounts.Beginner / allStudents.length) * 100).toFixed(0) : 0}% of total</p>
        </div>
      </div>

      {/* ── Promotion Rules (admin / teacher info) ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">Automatic Promotion Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center mt-0.5 flex-shrink-0"><span className="text-xs font-bold">1</span></div>
            <div><p className="font-medium">Beginner → Intermediate:</p><p>Score ≥ 66% in <strong>3 consecutive quizzes</strong></p></div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center mt-0.5 flex-shrink-0"><span className="text-xs font-bold">2</span></div>
            <div><p className="font-medium">Intermediate → Advanced:</p><p>Score ≥ 82% in <strong>3 consecutive quizzes</strong></p></div>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-3 italic">⚠️ Promotion is automatic and cannot be manually overridden.</p>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Course filter — only visible to teachers */}
            {isTeacher && teacherCourses.length > 0 && (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All My Courses</option>
                {teacherCourses.map((c: any) => (
                  <option key={c.courseId || c.courseCode} value={c.courseId || c.courseCode}>
                    {c.courseName || c.courseCode}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* ── Students Table ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading students...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id || student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.name || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.email || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.department || '--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.semester ? `Sem ${student.semester}` : '--'}</td>
                    <td className="px-6 py-4">
                      {student.level ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadge(student.level)}`}>
                          {student.level}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">No students found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
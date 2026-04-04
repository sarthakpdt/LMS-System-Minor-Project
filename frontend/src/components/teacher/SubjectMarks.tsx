import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search, Download, BookOpen, Users, Award,
  TrendingUp, TrendingDown, Eye, BarChart2
} from 'lucide-react';

const API = 'http://localhost:5000/api';

// Helper: read the JWT token from wherever it is stored
function getToken(user: any): string {
  // AuthContext stores the full user object in lms_user — token is inside it
  if (user?.token) return user.token;
  try {
    const stored = localStorage.getItem('lms_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.token) return parsed.token;
    }
  } catch { /* ignore */ }
  return '';
}

export function SubjectMarks() {
  const { user } = useAuth();

  const [allCourses, setAllCourses]           = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading]   = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentsData, setStudentsData]       = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterLevel, setFilterLevel]         = useState('all');
  const [viewMode, setViewMode]               = useState<'my-subjects' | 'all-subjects'>('my-subjects');

  // ── Build set of courseIds assigned to this teacher ───────────────────────
  // user.assignedCourses[].courseId was fixed in authController to be a plain string,
  // but also handle ObjectId objects for backwards compatibility with old localStorage cache
  const myAssignedCourseIds: Set<string> = new Set(
    (user?.assignedCourses || [])
      .map((c: any) => {
        const id = c.courseId;
        if (!id) return '';
        // Handle both plain string and ObjectId object
        if (typeof id === 'string') return id;
        if (typeof id === 'object') {
          // ObjectId object has toString() method
          return String(id);
        }
        return String(id);
      })
      .filter(Boolean)
  );

  // ── Load ALL courses from DB once on mount ────────────────────────────────
  useEffect(() => {
    async function loadAllCourses() {
      setCoursesLoading(true);
      try {
        // GET /api/courses returns a plain array (not wrapped in { data })
        const res = await fetch(`${API}/courses`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const courses: any[] = Array.isArray(json) ? json : (json.data || []);
        setAllCourses(courses);
      } catch (err) {
        console.warn('Failed to load courses:', err);
        setAllCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    }
    loadAllCourses();
  }, []);

  // ── Derive visible course list based on view mode ─────────────────────────
  const myCourses = allCourses.filter(c => myAssignedCourseIds.has(String(c._id)));
  const availableCourses = viewMode === 'my-subjects' ? myCourses : allCourses;

  // ── Auto-select first course when list changes ────────────────────────────
  useEffect(() => {
    if (availableCourses.length > 0) {
      setSelectedCourseId(String(availableCourses[0]._id));
    } else {
      setSelectedCourseId('');
      setStudentsData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, allCourses.length]);

  // ── Fetch marks whenever selected course changes ──────────────────────────
  const loadMarks = useCallback(async (courseId: string) => {
    if (!courseId) { setStudentsData([]); return; }

    setLoadingStudents(true);
    try {
      const token = getToken(user);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = viewMode === 'my-subjects'
        ? `${API}/teachers/course/${courseId}/marks`
        : `${API}/teachers/all-courses/marks?courseId=${courseId}`;

      const res = await fetch(url, { headers });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Marks API error ${res.status}:`, errJson.message);
        setStudentsData([]);
        return;
      }

      const json = await res.json();
      setStudentsData(json.data || []);
    } catch (err) {
      console.warn('Failed to load marks:', err);
      setStudentsData([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [user, viewMode]);

  useEffect(() => {
    loadMarks(selectedCourseId);
  }, [selectedCourseId, loadMarks]);

  // ── Filter students ───────────────────────────────────────────────────────
  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel  = filterLevel === 'all' || student.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // ── Stats — always safe (no Infinity / divide-by-zero) ───────────────────
  const totalStudents = filteredStudents.length;
  const avgScore      = totalStudents > 0
    ? filteredStudents.reduce((acc, s) => acc + (Number(s.total) || 0), 0) / totalStudents
    : 0;
  const scores        = filteredStudents.map(s => Number(s.total) || 0);
  const highestScore  = totalStudents > 0 ? Math.max(...scores) : 0;
  const lowestScore   = totalStudents > 0 ? Math.min(...scores) : 0;
  const passRate      = totalStudents > 0
    ? (filteredStudents.filter(s => (Number(s.total) || 0) >= 60).length / totalStudents) * 100
    : 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced':     return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Beginner':     return 'bg-orange-100 text-orange-700 border-orange-200';
      default:             return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-300';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['Name', 'StudentID', 'Level', 'Midterm', 'Final', 'Assignments', 'Quiz Avg', 'Total', 'Grade', 'Attendance'];
    const rows    = filteredStudents.map(s => [
      `"${s.name}"`, s.studentId || '', s.level,
      s.midterm, s.final, s.assignments, s.quizAvg, s.total, s.grade, `${s.attendance}%`
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'subject_marks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const switchViewMode = (mode: 'my-subjects' | 'all-subjects') => {
    setViewMode(mode);
    setStudentsData([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Subject Marks</h2>
        <p className="text-gray-600">View and analyze student performance across different subjects.</p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">View Mode:</span>
            <div className="flex gap-2">
              <button
                onClick={() => switchViewMode('my-subjects')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'my-subjects'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  My Subjects
                </div>
              </button>
              <button
                onClick={() => switchViewMode('all-subjects')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'all-subjects'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  All Subjects (View Only)
                </div>
              </button>
            </div>
          </div>
          {viewMode === 'my-subjects' && (
            <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-green-700 font-medium">✓ You have edit access to your subjects</p>
            </div>
          )}
          {viewMode === 'all-subjects' && (
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">👁 View-only mode for other subjects</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject:</label>
            {coursesLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Loading subjects...
              </div>
            ) : availableCourses.length === 0 ? (
              <div className="w-full px-4 py-2 border border-orange-300 rounded-lg bg-orange-50 text-orange-700 text-sm">
                {viewMode === 'my-subjects'
                  ? 'No subjects assigned to you yet. Ask admin to assign courses to your account.'
                  : 'No courses found in the system.'}
              </div>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCourses.map((course: any) => {
                  const count = Array.isArray(course.enrolledStudents)
                    ? course.enrolledStudents.length
                    : 0;
                  return (
                    <option key={String(course._id)} value={String(course._id)}>
                      {course.courseName} ({course.courseCode}) — {count} student{count !== 1 ? 's' : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Subject Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" />
            <p className="text-sm opacity-90">Total Students</p>
          </div>
          <p className="text-3xl font-bold">{totalStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-5 h-5" />
            <p className="text-sm opacity-90">Average Score</p>
          </div>
          <p className="text-3xl font-bold">{avgScore.toFixed(1)}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm opacity-90">Highest Score</p>
          </div>
          <p className="text-3xl font-bold">{totalStudents > 0 ? `${highestScore}%` : 'N/A'}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5" />
            <p className="text-sm opacity-90">Lowest Score</p>
          </div>
          <p className="text-3xl font-bold">{totalStudents > 0 ? `${lowestScore}%` : 'N/A'}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5" />
            <p className="text-sm opacity-90">Pass Rate</p>
          </div>
          <p className="text-3xl font-bold">{passRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>
            <button
              onClick={handleExport}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Midterm</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Avg</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingStudents && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-500">
                    Loading students...
                  </td>
                </tr>
              )}
              {!loadingStudents && filteredStudents.map((student) => (
                <tr key={String(student.id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{student.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        {student.studentId && (
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(student.level)}`}>
                      {student.level === 'Advanced' && <Award className="w-3 h-3" />}
                      {student.level || 'Beginner'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{student.midterm}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{student.final}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{student.assignments}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{student.quizAvg}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-gray-900">{student.total}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(student.grade)}`}>
                      {student.grade || 'F'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-medium ${
                      student.attendance >= 90 ? 'text-green-600'
                      : student.attendance >= 75 ? 'text-yellow-600'
                      : 'text-red-600'
                    }`}>
                      {student.attendance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.trend === 'up'
                      ? <TrendingUp  className="w-5 h-5 text-green-500 mx-auto" />
                      : <TrendingDown className="w-5 h-5 text-red-500 mx-auto" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loadingStudents && filteredStudents.length === 0 && !coursesLoading && (
        <div className="text-center py-12 text-gray-500">
          {!selectedCourseId
            ? 'Please select a subject to view student marks.'
            : availableCourses.length === 0
            ? viewMode === 'my-subjects'
              ? 'No subjects are assigned to you. Contact admin to assign courses.'
              : 'No courses exist in the system yet.'
            : 'No students found matching your criteria.'}
        </div>
      )}
    </div>
  );
}

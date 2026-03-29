import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Download, Filter, BookOpen, Users, Award, TrendingUp, TrendingDown, Eye, BarChart2 } from 'lucide-react';



export function SubjectMarks() {
  const { user } = useAuth();
  // dynamic lists loaded from DB
  const [subjectsData, setSubjectsData] = useState<any[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  // teacher's own subjects or courses
  const [mySubjects, setMySubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'my-subjects' | 'all-subjects'>('my-subjects');

  // load data on mount or when user changes
  useEffect(() => {
    async function load() {
      try {
        // fetch approved students
        const res = await fetch('http://localhost:5000/api/admin/students/approved');
        if (!res.ok) return;
        const json = await res.json();
        const students = json.data || [];
        setStudentsData(students);

        // build subjects list from student courses
        const subjSet = new Set<string>();
        students.forEach((s: any) => {
          if (s.courses && Array.isArray(s.courses)) {
            s.courses.forEach((c: any) => {
              if (c.courseName) subjSet.add(c.courseName);
              else if (c.courseCode) subjSet.add(c.courseCode);
            });
          }
        });
        const allSubjects = Array.from(subjSet).map((name, idx) => ({ id: idx, name, teacher: '', studentCount: 0, category: '' }));
        setSubjectsData(allSubjects);

        // if teacher, fetch own profile for assigned courses
        if (user?.role === 'teacher') {
          const prof = await fetch(`http://localhost:5000/api/admin/teachers/${user.id}`);
          if (prof.ok) {
            const teacher = (await prof.json()).data || {};
            if (teacher.assignedCourses && Array.isArray(teacher.assignedCourses)) {
              setMySubjects(teacher.assignedCourses.map((c: any) => c.courseName || c.courseCode));
            }
          }
        }

        // select first subject by default
        setSelectedSubject(allSubjects[0]?.name || '');
      } catch (err) {
        console.warn('Failed to load subject marks data', err);
      }
    }
    load();
  }, [user]);

  // Filter subjects based on view mode
  const availableSubjects = viewMode === 'my-subjects' 
    ? subjectsData.filter(s => mySubjects.includes(s.name))
    : subjectsData;

  // Get students for selected subject (from raw student courses)
  const subjectStudents = studentsData
    .map((stu) => {
      const course = (stu.courses || []).find((c: any) => (c.courseName || c.courseCode) === selectedSubject);
      if (course) {
        return {
          id: stu._id,
          name: stu.name,
          avatar: stu.name ? stu.name.split(' ').map(n=>n[0]).join('') : '',
          subject: selectedSubject,
          level: course.level || '',
          midterm: course.midterm || 0,
          final: course.final || 0,
          assignments: course.assignments || 0,
          quizAvg: course.quizAvg || 0,
          total: course.marks || course.grade || 0,
          grade: course.grade || '',
          trend: course.trend || '',
          attendance: stu.attendance || 0,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Filter students based on search and level
  const filteredStudents = subjectStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || student.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Calculate subject statistics
  const subjectStats = {
    totalStudents: subjectStudents.length,
    avgScore: subjectStudents.reduce((acc, s) => acc + s.total, 0) / subjectStudents.length || 0,
    highestScore: Math.max(...subjectStudents.map(s => s.total)),
    lowestScore: Math.min(...subjectStudents.map(s => s.total)),
    passRate: (subjectStudents.filter(s => s.total >= 60).length / subjectStudents.length * 100) || 0,
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced': return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Beginner': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-300';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

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
                onClick={() => {
                  setViewMode('my-subjects');
                  setSelectedSubject(mySubjects[0]);
                }}
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
                onClick={() => {
                  setViewMode('all-subjects');
                  setSelectedSubject(subjectsData[0].name);
                }}
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
              <p className="text-xs text-green-700 font-medium">
                ✓ You have edit access to your subjects
              </p>
            </div>
          )}
          {viewMode === 'all-subjects' && (
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">
                👁 View-only mode for other subjects
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableSubjects.map((subject) => {
                const count = studentsData.filter((stu) =>
                  (stu.courses || []).some((c: any) => (c.courseName||c.courseCode) === subject.name)
                ).length;
                return (
                  <option key={subject.id} value={subject.name}>
                    {subject.name} ({count} students)
                    {viewMode === 'my-subjects' ? ' - My Subject' : ` - ${subject.teacher}`}
                  </option>
                );
              })}
            </select>
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
          <p className="text-3xl font-bold">{subjectStats.totalStudents}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-5 h-5" />
            <p className="text-sm opacity-90">Average Score</p>
          </div>
          <p className="text-3xl font-bold">{subjectStats.avgScore.toFixed(1)}%</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm opacity-90">Highest Score</p>
          </div>
          <p className="text-3xl font-bold">{subjectStats.highestScore}%</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5" />
            <p className="text-sm opacity-90">Lowest Score</p>
          </div>
          <p className="text-3xl font-bold">{subjectStats.lowestScore}%</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5" />
            <p className="text-sm opacity-90">Pass Rate</p>
          </div>
          <p className="text-3xl font-bold">{subjectStats.passRate.toFixed(0)}%</p>
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
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{student.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(student.level)}`}>
                      {student.level === 'Advanced' && <Award className="w-3 h-3" />}
                      {student.level}
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
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-medium ${student.attendance >= 90 ? 'text-green-600' : student.attendance >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {student.attendance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No students found matching your criteria.
        </div>
      )}
    </div>
  );
}

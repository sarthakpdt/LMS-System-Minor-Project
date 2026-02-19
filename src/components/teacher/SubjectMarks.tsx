import { useState } from 'react';
import { Search, Download, Filter, BookOpen, Users, Award, TrendingUp, TrendingDown, Eye, BarChart2 } from 'lucide-react';

// Mock data for subjects and students
const subjectsData = [
  { id: 1, name: 'Mathematics 101', teacher: 'Dr. Sarah Johnson', studentCount: 156, category: 'Mathematics' },
  { id: 2, name: 'Physics 202', teacher: 'Prof. Michael Chen', studentCount: 124, category: 'Science' },
  { id: 3, name: 'Chemistry 301', teacher: 'Dr. Emily White', studentCount: 98, category: 'Science' },
  { id: 4, name: 'English Literature', teacher: 'Prof. James Wilson', studentCount: 187, category: 'Arts' },
  { id: 5, name: 'Computer Science 101', teacher: 'Dr. David Lee', studentCount: 201, category: 'Technology' },
  { id: 6, name: 'Biology 150', teacher: 'Dr. Amanda Brown', studentCount: 143, category: 'Science' },
  { id: 7, name: 'History 201', teacher: 'Prof. Robert Garcia', studentCount: 112, category: 'Arts' },
  { id: 8, name: 'Economics 101', teacher: 'Dr. Lisa Martinez', studentCount: 165, category: 'Business' },
];

const studentMarksData = [
  // Mathematics 101
  { id: 1, name: 'Sarah Johnson', avatar: 'SJ', subject: 'Mathematics 101', level: 'Advanced', midterm: 95, final: 97, assignments: 94, quizAvg: 96, total: 96, grade: 'A+', trend: 'up', attendance: 98 },
  { id: 2, name: 'David Lee', avatar: 'DL', subject: 'Mathematics 101', level: 'Advanced', midterm: 92, final: 94, assignments: 93, quizAvg: 93, total: 93, grade: 'A', trend: 'up', attendance: 96 },
  { id: 3, name: 'Emma Thompson', avatar: 'ET', subject: 'Mathematics 101', level: 'Intermediate', midterm: 78, final: 80, assignments: 77, quizAvg: 79, total: 79, grade: 'B+', trend: 'up', attendance: 94 },
  { id: 4, name: 'Michael Chen', avatar: 'MC', subject: 'Mathematics 101', level: 'Intermediate', midterm: 74, final: 76, assignments: 75, quizAvg: 75, total: 75, grade: 'B', trend: 'up', attendance: 88 },
  { id: 5, name: 'James Wilson', avatar: 'JW', subject: 'Mathematics 101', level: 'Beginner', midterm: 60, final: 63, assignments: 62, quizAvg: 61, total: 62, grade: 'D', trend: 'up', attendance: 78 },
  
  // Physics 202
  { id: 6, name: 'Emily White', avatar: 'EW', subject: 'Physics 202', level: 'Advanced', midterm: 91, final: 93, assignments: 92, quizAvg: 92, total: 92, grade: 'A', trend: 'up', attendance: 95 },
  { id: 7, name: 'Sophia Chen', avatar: 'SC', subject: 'Physics 202', level: 'Advanced', midterm: 89, final: 91, assignments: 90, quizAvg: 90, total: 90, grade: 'A-', trend: 'up', attendance: 96 },
  { id: 8, name: 'Olivia Davis', avatar: 'OD', subject: 'Physics 202', level: 'Intermediate', midterm: 75, final: 77, assignments: 76, quizAvg: 76, total: 76, grade: 'B', trend: 'up', attendance: 91 },
  { id: 9, name: 'Daniel Garcia', avatar: 'DG', subject: 'Physics 202', level: 'Intermediate', midterm: 72, final: 74, assignments: 73, quizAvg: 73, total: 73, grade: 'B-', trend: 'up', attendance: 88 },
  { id: 10, name: 'Michael Brown', avatar: 'MB', subject: 'Physics 202', level: 'Beginner', midterm: 56, final: 58, assignments: 57, quizAvg: 57, total: 57, grade: 'F', trend: 'up', attendance: 82 },
  
  // Chemistry 301
  { id: 11, name: 'Ryan Martinez', avatar: 'RM', subject: 'Chemistry 301', level: 'Advanced', midterm: 87, final: 89, assignments: 88, quizAvg: 88, total: 88, grade: 'A-', trend: 'up', attendance: 94 },
  { id: 12, name: 'Ava Martinez', avatar: 'AM', subject: 'Chemistry 301', level: 'Intermediate', midterm: 70, final: 72, assignments: 71, quizAvg: 71, total: 71, grade: 'B-', trend: 'down', attendance: 85 },
  { id: 13, name: 'Ethan Taylor', avatar: 'ET', subject: 'Chemistry 301', level: 'Intermediate', midterm: 68, final: 70, assignments: 69, quizAvg: 69, total: 69, grade: 'C+', trend: 'up', attendance: 85 },
  { id: 14, name: 'Isabella Lee', avatar: 'IL', subject: 'Chemistry 301', level: 'Beginner', midterm: 54, final: 56, assignments: 55, quizAvg: 55, total: 55, grade: 'F', trend: 'down', attendance: 75 },
  
  // Computer Science 101
  { id: 15, name: 'Noah Anderson', avatar: 'NA', subject: 'Computer Science 101', level: 'Intermediate', midterm: 66, final: 68, assignments: 67, quizAvg: 67, total: 67, grade: 'C', trend: 'up', attendance: 89 },
  { id: 16, name: 'Liam Harris', avatar: 'LH', subject: 'Computer Science 101', level: 'Beginner', midterm: 50, final: 52, assignments: 51, quizAvg: 51, total: 51, grade: 'F', trend: 'down', attendance: 70 },
  
  // English Literature
  { id: 17, name: 'Mia Johnson', avatar: 'MJ', subject: 'English Literature', level: 'Beginner', midterm: 47, final: 49, assignments: 48, quizAvg: 48, total: 48, grade: 'F', trend: 'down', attendance: 68 },
];

// Teacher's assigned subjects (you can modify this based on the logged-in teacher)
const mySubjects = ['Mathematics 101', 'Physics 202'];

export function SubjectMarks() {
  const [selectedSubject, setSelectedSubject] = useState(mySubjects[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'my-subjects' | 'all-subjects'>('my-subjects');

  // Filter subjects based on view mode
  const availableSubjects = viewMode === 'my-subjects' 
    ? subjectsData.filter(s => mySubjects.includes(s.name))
    : subjectsData;

  // Get students for selected subject
  const subjectStudents = studentMarksData.filter(student => student.subject === selectedSubject);

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
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name} ({subject.studentCount} students)
                  {viewMode === 'my-subjects' ? ' - My Subject' : ` - ${subject.teacher}`}
                </option>
              ))}
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

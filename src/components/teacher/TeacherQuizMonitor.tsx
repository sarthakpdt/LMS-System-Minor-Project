import { useParams, Link } from 'react-router';
import { ArrowLeft, Camera, Monitor, AlertTriangle, CheckCircle, Clock, User, Eye } from 'lucide-react';

const mockStudents = [
  { 
    id: 1, 
    name: 'Emma Thompson', 
    avatar: 'ET',
    status: 'active',
    progress: 75,
    flagged: false,
    tabSwitches: 0,
    facialDetection: true,
    timeElapsed: 28,
    questionsAnswered: 15
  },
  { 
    id: 2, 
    name: 'James Wilson', 
    avatar: 'JW',
    status: 'active',
    progress: 60,
    flagged: true,
    tabSwitches: 3,
    facialDetection: false,
    timeElapsed: 28,
    questionsAnswered: 12
  },
  { 
    id: 3, 
    name: 'Sophia Chen', 
    avatar: 'SC',
    status: 'active',
    progress: 85,
    flagged: false,
    tabSwitches: 0,
    facialDetection: true,
    timeElapsed: 28,
    questionsAnswered: 17
  },
  { 
    id: 4, 
    name: 'Michael Brown', 
    avatar: 'MB',
    status: 'completed',
    progress: 100,
    flagged: true,
    tabSwitches: 5,
    facialDetection: true,
    timeElapsed: 30,
    questionsAnswered: 20
  },
];

export function TeacherQuizMonitor() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <Link to="/quizzes" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Quiz Management
      </Link>

      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Live Quiz Monitoring</h2>
        <p className="text-gray-600">Real-time monitoring of quiz attempts with anti-cheating detection.</p>
      </div>

      {/* Quiz Info Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 mb-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">Newton's Laws Quiz</h3>
            <p className="text-green-100">Physics 202</p>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
            Active Now
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-100 mb-1">Total Students</p>
            <p className="text-2xl font-bold">124</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Taking Quiz</p>
            <p className="text-2xl font-bold">89</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Completed</p>
            <p className="text-2xl font-bold">35</p>
          </div>
          <div>
            <p className="text-sm text-green-100 mb-1">Flagged</p>
            <p className="text-2xl font-bold text-yellow-300">2</p>
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
              <p className="text-2xl font-bold text-red-600">8</p>
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
              <p className="text-2xl font-bold text-purple-600">1</p>
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
              <p className="text-2xl font-bold text-green-600">86</p>
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
              <p className="text-2xl font-bold text-orange-600">28m</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Out of 30 minutes</p>
        </div>
      </div>

      {/* Student Monitoring Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Activity Monitor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tab Switches</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Face Detection</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-gray-50 ${student.flagged ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        student.flagged ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-semibold ${
                          student.flagged ? 'text-red-600' : 'text-blue-600'
                        }`}>{student.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        {student.flagged && (
                          <p className="text-xs text-red-600 font-medium">⚠ Flagged for review</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status === 'active' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {student.questionsAnswered}/20 ({student.progress}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-900">{student.timeElapsed} min</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.tabSwitches > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {student.tabSwitches > 0 && <AlertTriangle className="w-3 h-3" />}
                      {student.tabSwitches}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.facialDetection ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        Not Detected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      View Screen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

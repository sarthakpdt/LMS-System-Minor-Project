import { useParams, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Camera, Monitor, AlertTriangle, CheckCircle, Clock, User, Eye } from 'lucide-react';

// will be populated from backend

export function TeacherQuizMonitor() {
  const { id } = useParams();
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:5000/api/admin/students/approved');
        if (!res.ok) return;
        let data = (await res.json()).data || [];
        if (user?.role === 'teacher') {
          const prof = await fetch(`http://localhost:5000/api/admin/teachers/${user.id}`);
          if (prof.ok) {
            const teacher = (await prof.json()).data || {};
            if (teacher.assignedStudents && teacher.assignedStudents.length) {
              const ids = new Set(teacher.assignedStudents.map((s: any) => String(s._id || s)));
              data = data.filter((s: any) => ids.has(String(s._id)));
            }
          }
        }
        setStudents(data);
      } catch (err) {
        console.warn('failed to load students for quiz monitor', err);
      }
    }
    load();
  }, [user]);

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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id || student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{student.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">{student.email}</p>
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

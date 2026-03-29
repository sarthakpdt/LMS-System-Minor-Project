import { useState } from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const assignmentsData = [
  { id: 1, title: 'Calculus Problem Set 3', course: 'Mathematics 101', dueDate: '2026-02-05', submissions: 142, total: 156, avgScore: 84, status: 'active' },
  { id: 2, title: 'Physics Lab Report', course: 'Physics 202', dueDate: '2026-02-03', submissions: 98, total: 124, avgScore: 78, status: 'active' },
  { id: 3, title: 'Organic Chemistry Quiz', course: 'Chemistry 301', dueDate: '2026-02-08', submissions: 88, total: 98, avgScore: 91, status: 'active' },
  { id: 4, title: 'Essay: Shakespeare Analysis', course: 'English Literature', dueDate: '2026-01-28', submissions: 187, total: 187, avgScore: 86, status: 'completed' },
  { id: 5, title: 'Python Programming Project', course: 'Computer Science 101', dueDate: '2026-02-10', submissions: 45, total: 201, avgScore: 0, status: 'active' },
  { id: 6, title: 'Cell Biology Exam', course: 'Biology 150', dueDate: '2026-01-30', submissions: 143, total: 143, avgScore: 82, status: 'grading' },
  { id: 7, title: 'World War II Timeline', course: 'History 201', dueDate: '2026-02-01', submissions: 105, total: 112, avgScore: 88, status: 'active' },
  { id: 8, title: 'Market Analysis Report', course: 'Economics 101', dueDate: '2026-02-12', submissions: 23, total: 165, avgScore: 0, status: 'active' },
];

export function Assignments() {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAssignments = assignmentsData.filter(assignment => {
    return filterStatus === 'all' || assignment.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'grading': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'grading': return <Clock className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const getSubmissionPercentage = (submissions: number, total: number) => {
    return Math.round((submissions / total) * 100);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Assignments</h2>
        <p className="text-gray-600">Track assignment submissions, grades, and deadlines across all courses.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{assignmentsData.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{assignmentsData.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Grading</p>
              <p className="text-2xl font-bold text-gray-900">{assignmentsData.filter(a => a.status === 'grading').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{assignmentsData.filter(a => a.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'active', 'grading', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{assignment.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{assignment.course}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            getSubmissionPercentage(assignment.submissions, assignment.total) === 100
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${getSubmissionPercentage(assignment.submissions, assignment.total)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {assignment.submissions}/{assignment.total} ({getSubmissionPercentage(assignment.submissions, assignment.total)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {assignment.avgScore > 0 ? (
                      <span className="text-sm font-medium text-gray-900">{assignment.avgScore}%</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {getStatusIcon(assignment.status)}
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No assignments found with the selected filter.
        </div>
      )}
    </div>
  );
}

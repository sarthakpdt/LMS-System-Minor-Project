import React from 'react';

interface Course {
  _id: string;
  courseName: string;
  attendance?: number; // current attendance percentage (0-100)
  totalClasses?: number; // total number of classes conducted so far
}

interface AttendanceStatsProps {
  courses: Course[];
}

const TOTAL_CLASSES = 30; // assumed total classes for prediction if not provided

// Helper to generate a conic gradient for a given percentage
const getConicGradient = (percent: number, color: string) => {
  const deg = (percent / 100) * 360;
  return `conic-gradient(${color} ${deg}deg, #e5e7eb ${deg}deg)`;
};

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({ courses }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
      {courses.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No attendance data available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const cur = c.attendance ?? 0;
            const total = c.totalClasses ?? TOTAL_CLASSES;
            const attendedSoFar = Math.round((cur / 100) * total);
            const predAdd = Math.min(100, Math.round(((attendedSoFar + 3) / total) * 100));
            const predMiss = Math.max(0, Math.round(((attendedSoFar - 1) / total) * 100));
            return (
              <div
                key={c._id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm hover:shadow-lg hover:scale-105 transition transform duration-200"
              >
                <div className="flex flex-col items-center">
                  {/* Circular progress */}
                  <div
                    className="relative flex items-center justify-center w-24 h-24 mb-3"
                    style={{ background: getConicGradient(cur, '#3b82f6'), borderRadius: '50%' }}
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xl font-medium text-blue-600">{cur}%</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-800 text-center truncate mb-2" title={c.courseName}>
                    {c.courseName}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm w-full">
                    <div className="text-gray-600">If you attend 3 more</div>
                    <div className="text-green-600 font-medium">{predAdd}%</div>
                    <div className="text-gray-600">If you miss 1 class</div>
                    <div className="text-red-600 font-medium">{predMiss}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

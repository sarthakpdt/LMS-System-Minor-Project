import React from 'react';

export interface SubjectData {
  subject: string;
  courseCode: string;
  attendancePercentage?: number;
  totalLectures?: number | string;
  total?: number | string;
  present: number | string;
  absent: number | string;
  activityBreakdown?: {
    LECTURE: number | string;
    LAB: number | string;
    TUTORIAL: number | string;
  };
  activities?: { type: string; percentage: number }[]; // fallback
  riskLevel?: string;
  noteTag?: string;
}

interface ThemeConfig {
  bgColor: string;
  borderColor: string;
  ringColor: string;
  textColor: string;
  statusText: string;
}

function getCardTheme(pct: number | undefined, customNoteTag?: string): ThemeConfig {
  if (pct === undefined) {
    return {
      bgColor: 'bg-gray-50/50 dark:bg-gray-900/30',
      borderColor: 'border-gray-200 dark:border-gray-800',
      ringColor: '#D1D5DB',
      textColor: 'text-gray-500 dark:text-gray-400',
      statusText: '—'
    };
  }

  // Check custom status text overrides based on noteTag or risk level
  let statusText = 'Present';
  if (pct >= 90) {
    return {
      bgColor: 'bg-green-50/40 dark:bg-green-950/10',
      borderColor: 'border-green-150 dark:border-green-900/40',
      ringColor: '#10B981',
      textColor: 'text-green-700 dark:text-green-400',
      statusText: 'Present'
    };
  } else if (pct >= 80) {
    return {
      bgColor: 'bg-yellow-50/40 dark:bg-yellow-950/10',
      borderColor: 'border-yellow-150 dark:border-yellow-900/40',
      ringColor: '#EAB308',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      statusText: 'Present'
    };
  } else if (pct >= 70) {
    return {
      bgColor: 'bg-orange-50/40 dark:bg-orange-950/10',
      borderColor: 'border-orange-150 dark:border-orange-900/40',
      ringColor: '#F97316',
      textColor: 'text-orange-700 dark:text-orange-400',
      statusText: customNoteTag && customNoteTag.toLowerCase().includes('risk') ? 'Risk Risk' : 'Red'
    };
  } else {
    return {
      bgColor: 'bg-red-50/40 dark:bg-red-950/10',
      borderColor: 'border-red-150 dark:border-red-900/40',
      ringColor: '#EF4444',
      textColor: 'text-red-700 dark:text-red-400',
      statusText: 'High Risk'
    };
  }
}

const CircularAttendance: React.FC<{
  percentage?: number;
  theme: ThemeConfig;
}> = ({ percentage, theme }) => {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = percentage !== undefined ? Math.min(Math.max(percentage, 0), 100) : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-gray-200, #E5E7EB)"
          className="dark:stroke-gray-800"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {percentage !== undefined ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray="6 6"
          />
        )}
      </svg>
      {/* Inside the circle: e.g. "92% Present" */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {percentage !== undefined ? (
          <>
            <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {percentage}%
            </span>
            <span className={`text-[10px] font-bold ${theme.textColor} uppercase tracking-wider`}>
              {theme.statusText}
            </span>
          </>
        ) : (
          <span className="text-2xl font-bold text-gray-400">—</span>
        )}
      </div>
    </div>
  );
};

export const AttendanceCard: React.FC<{ subject: SubjectData }> = ({ subject }) => {
  const {
    subject: name,
    courseCode,
    attendancePercentage,
    totalLectures,
    total,
    present,
    absent,
    activityBreakdown,
    activities,
    noteTag
  } = subject;

  const totalLecturesValue = totalLectures ?? total ?? 0;
  const theme = getCardTheme(attendancePercentage, noteTag);

  // Normalize activities for the breakdown list
  const breakdown = activityBreakdown || {
    LECTURE: activities?.find(a => a.type.toUpperCase() === 'LECTURE')?.percentage ?? (attendancePercentage || 0),
    LAB: activities?.find(a => a.type.toUpperCase() === 'LAB')?.percentage ?? (attendancePercentage || 0),
    TUTORIAL: activities?.find(a => a.type.toUpperCase() === 'TUTORIAL')?.percentage ?? (attendancePercentage || 0)
  };

  return (
    <div
      className={`relative rounded-2xl border ${theme.borderColor} ${theme.bgColor} p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[360px]`}
    >
      {/* Top note tag representing specific mockup states */}
      {noteTag && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
          {noteTag}
        </div>
      )}

      {/* Header Info */}
      <div className="text-center pt-2 mb-2">
        <h3 className="text-base font-bold text-gray-800 dark:text-white line-clamp-1">
          {name}
        </h3>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
          ({courseCode})
        </p>
      </div>

      {/* Circle Ring */}
      <div className="flex justify-center my-3">
        <CircularAttendance percentage={attendancePercentage} theme={theme} />
      </div>

      {/* Label under Circle */}
      <div className="text-center mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {attendancePercentage !== undefined ? 'Attendance %' : 'Attendance Not Available'}
        </p>
      </div>

      {/* Stats row */}
      <div className="border-t border-gray-200/60 dark:border-gray-800/60 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">{totalLecturesValue}</p>
          </div>
          <div className="border-x border-gray-200/60 dark:border-gray-800/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Present</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">{present}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Absent</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">{absent}</p>
          </div>
        </div>
      </div>

      {/* Activity Breakdown List */}
      <div className="border-t border-gray-200/60 dark:border-gray-800/60 pt-3">
        {attendancePercentage !== undefined ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 text-center">
              Activity Breakdown
            </p>
            <div className="flex items-center justify-around text-xs text-gray-600 dark:text-gray-300">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-gray-500 dark:text-gray-400 text-[10px]">Lecture</span>
                <span className="font-bold mt-0.5 flex items-center gap-0.5">
                  {breakdown.LECTURE}% <span className="text-emerald-500 font-extrabold text-[10px]">P</span>
                </span>
              </div>
              <div className="flex flex-col items-center border-x border-gray-200/60 dark:border-gray-800/60 px-4">
                <span className="font-semibold text-gray-500 dark:text-gray-400 text-[10px]">Lab</span>
                <span className="font-bold mt-0.5 flex items-center gap-0.5">
                  {breakdown.LAB}% <span className="text-emerald-500 font-extrabold text-[10px]">P</span>
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-gray-500 dark:text-gray-400 text-[10px]">Tutorial</span>
                <span className="font-bold mt-0.5 flex items-center gap-0.5">
                  {breakdown.TUTORIAL}% <span className="text-emerald-500 font-extrabold text-[10px]">P</span>
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-2 text-center">
            <span className="bg-gray-150 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase px-3 py-1 rounded-md shadow-xs">
              No Attendance Marked Yet
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

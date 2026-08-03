import { CalendarCheck, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, StatCard, Badge } from '../../../theme/components';
import type { AcademicHealthData } from './types';

const RISK_BADGE: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  safe: { variant: 'success', label: 'Safe' },
  warning: { variant: 'warning', label: 'At Risk' },
  critical: { variant: 'error', label: 'Critical' },
};

interface AttendanceHealthSectionProps {
  attendance: AcademicHealthData['attendance'];
}

export function AttendanceHealthSection({ attendance }: AttendanceHealthSectionProps) {
  const risk = RISK_BADGE[attendance.riskLevel] || RISK_BADGE.warning;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Health</h3>
        <Badge variant={risk.variant} size="sm">{risk.label}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          role="student"
          icon={<CheckCircle className="w-5 h-5" />}
          label="Current Attendance"
          value={`${attendance.currentPercentage}%`}
        />
        <StatCard
          role="student"
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Required"
          value={`${attendance.requiredPercentage}%`}
        />
        <StatCard
          role="student"
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Classes Attended"
          value={attendance.classesAttended}
        />
        <StatCard
          role="student"
          icon={<XCircle className="w-5 h-5" />}
          label="Classes Missed"
          value={attendance.classesMissed}
        />
        <StatCard
          role="student"
          icon={<CheckCircle className="w-5 h-5" />}
          label="Can Miss More"
          value={attendance.canMissMore}
        />
        <StatCard
          role="student"
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Need for Safe Zone"
          value={attendance.classesNeededForSafeZone}
        />
      </div>

      {attendance.subjects.length > 0 && (
        <Card noPadding className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject-wise Attendance</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {attendance.subjects.map((s) => {
              const subRisk = RISK_BADGE[s.riskLevel] || RISK_BADGE.warning;
              return (
                <div key={s.subject} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{s.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.courseCode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.attendancePercentage >= 75 ? 'bg-green-500' :
                          s.attendancePercentage >= 65 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, s.attendancePercentage)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                      {s.attendancePercentage}%
                    </span>
                    <Badge variant={subRisk.variant} size="sm">{subRisk.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

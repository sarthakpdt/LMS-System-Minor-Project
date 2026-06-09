import { ringStrokeColor } from './attendanceUtils';
import type { SubjectAttendance } from './StudentAttendance.types';

interface AttendanceRingProps {
  percentage: number;
  riskLevel: SubjectAttendance['riskLevel'];
  size?: number;
  label?: string;
}

export default function AttendanceRing({
  percentage,
  riskLevel,
  size = 120,
  label = 'Present',
}: AttendanceRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringStrokeColor(riskLevel)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold text-slate-800">{clamped.toFixed(clamped % 1 ? 2 : 0)}%</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
    </div>
  );
}

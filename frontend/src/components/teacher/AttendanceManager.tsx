import TeacherScheduleDashboard from './TeacherScheduleDashboard';

interface Props {
  teacherId?: string;
  teacherName?: string;
}

export default function AttendanceManager({ teacherId, teacherName }: Props) {
  if (!teacherId) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please sign in as a teacher to manage schedule and attendance.
      </div>
    );
  }
  return <TeacherScheduleDashboard teacherId={teacherId} teacherName={teacherName} />;
}

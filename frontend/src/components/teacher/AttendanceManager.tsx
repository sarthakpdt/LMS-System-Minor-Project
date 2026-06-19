import AttendanceTaker from '../attendance/AttendanceTaker';

interface Props {
  teacherId?: string;
  teacherName?: string;
}

export default function AttendanceManager({ teacherId, teacherName }: Props) {
  return <AttendanceTaker teacherId={teacherId} teacherName={teacherName} />;
}

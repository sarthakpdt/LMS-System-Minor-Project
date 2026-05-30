import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AttendanceTaker from './AttendanceTaker';

export default function TeacherAttendancePage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading attendance panel...
      </div>
    );
  }
  if (!user?.id) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Please sign in as a teacher to manage attendance.
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-full bg-slate-50 p-6 sm:p-8">
      <AttendanceTaker teacherId={user.id} teacherName={user.name} />
    </div>
  );
}

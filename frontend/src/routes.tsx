import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { TeacherLayoutNew } from "./components/layouts/TeacherLayoutNew";
import { StudentLayout } from "./components/layouts/StudentLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedTeacherRoute } from "./components/auth/ProtectedTeacherRoute";
import { Dashboard } from "./components/Dashboard";
import { Students } from "./components/Students";
import { Courses } from "./components/Courses";
import { Assignments } from "./components/Assignments";
import { Analytics } from "./components/Analytics";
import { StudyMaterials } from "./components/StudyMaterials";
import { Assessments } from "./components/Assessments";
import { AutoGrading } from "./components/AutoGrading";
import { StudentPortalNew } from "./components/StudentPortalNew";
import { PerformanceLevels } from "./components/PerformanceLevels";
import { TeacherQuizManagement } from "./components/teacher/TeacherQuizManagement";
import { TeacherQuizMonitor } from "./components/teacher/TeacherQuizMonitor";
import { SubjectMarks } from "./components/teacher/SubjectMarks";
import { TeacherNotifications } from "./components/teacher/TeacherNotifications";
import { StudentQuizList } from "./components/student/StudentQuizList";
import { StudentQuizTake } from "./components/student/StudentQuizTake";
import { AdminQuizDashboardNew } from "./components/admin/AdminQuizDashboardNew";
import { StudentApprovals } from "./components/admin/StudentApprovals";
import { NotFound } from "./components/NotFound";
import { StudentAuthNew } from "./components/auth/StudentAuthNew";
import { TeacherAuth } from "./components/auth/TeacherAuth";
// NEW imports
import { BucketDashboard } from "./components/teacher/BucketDashboard";
import { StudentBucketProgress } from "./components/student/StudentBucketProgress";
import StudentAttendancePage from "./components/student/StudentAttendancePage";
import TeacherAttendancePage from "./components/attendance/TeacherAttendancePage";
// AIAgent removed - AI Assistant feature moved to inline icon on Dashboard
import TimetableDashboard from './components/timetable/TimetableDashboard';

function ProtectedStudentLayout() {
  return (
    <ProtectedRoute>
      <StudentLayout />
    </ProtectedRoute>
  );
}

function ProtectedTeacherLayout() {
  return (
    <ProtectedTeacherRoute>
      <TeacherLayoutNew />
    </ProtectedTeacherRoute>
  );
}

export function createRouterForRole(role: 'admin' | 'teacher' | 'student') {
  if (role === 'student') {
    return createBrowserRouter([
      {
        path: "/auth",
        Component: StudentAuthNew,
      },
      {
        path: "/",
        Component: ProtectedStudentLayout,
        children: [
          { index: true, Component: StudentPortalNew },
          { path: "courses", Component: Courses },
        { path: "assignments", Component: Assignments },
        { path: "materials", Component: StudyMaterials },
        { path: "attendance", Component: StudentAttendancePage },
        { path: "quizzes", Component: StudentQuizList },
        { path: "quiz/:id", Component: StudentQuizTake },
        // NEW: student progress page
        { path: "my-progress", Component: StudentBucketProgress },
        // ai-assistant route removed - now accessible via AI icon on Dashboard
        { path: "*", Component: NotFound },
        ],
      },
    ]);
  }

  if (role === 'teacher') {
    return createBrowserRouter([
      {
        // Teacher login page — uses the dedicated TeacherAuth component
        path: "/auth",
        Component: TeacherAuth,
      },
      {
        path: "/",
        Component: ProtectedTeacherLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "students", Component: Students },
          { path: "courses", Component: Courses },
          { path: "marks", Component: SubjectMarks },
          { path: "materials", Component: StudyMaterials },
          { path: "assignments", Component: Assignments },
          { path: "attendance", Component: TeacherAttendancePage },
          { path: "quizzes", Component: TeacherQuizManagement },
          { path: "quiz-monitor/:id", Component: TeacherQuizMonitor },
          { path: "grading", Component: AutoGrading },
          { path: "performance-levels", Component: PerformanceLevels },
          { path: "analytics", Component: Analytics },
          { path: "notifications", Component: TeacherNotifications },
          // NEW: bucket management dashboard
          { path: "bucket-dashboard", Component: BucketDashboard },
          { path: "*", Component: NotFound },
        ],
      },
    ]);
  }

  // Admin routes
  return createBrowserRouter([
    {
      path: "/auth",
      Component: StudentAuthNew,
    },
    {
      path: "/",
      Component: AdminLayout,
      children: [
        { index: true, Component: Dashboard },
        { path: "students", Component: Students },
        { path: "student-approvals", Component: StudentApprovals },
        { path: "courses", Component: Courses },
        { path: "materials", Component: StudyMaterials },
        { path: "assignments", Component: Assignments },
        { path: "assessments", Component: Assessments },
        { path: "quizzes", Component: AdminQuizDashboardNew },
        { path: "grading", Component: AutoGrading },
        { path: "performance-levels", Component: PerformanceLevels },
        { path: "notifications", Component: TeacherNotifications },
        { path: "analytics", Component: Analytics },
        { path: "timetable", Component: TimetableDashboard },
        { path: "*", Component: NotFound },
      ],
    },
  ]);
}

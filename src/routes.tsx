import { createBrowserRouter, Navigate } from "react-router";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { TeacherLayout } from "./components/layouts/TeacherLayout";
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
import { StudentPortal } from "./components/StudentPortal";
import { PerformanceLevels } from "./components/PerformanceLevels";
import { TeacherQuizManagement } from "./components/teacher/TeacherQuizManagement";
import { TeacherQuizMonitor } from "./components/teacher/TeacherQuizMonitor";
import { SubjectMarks } from "./components/teacher/SubjectMarks";
import { TeacherNotifications } from "./components/teacher/TeacherNotifications";
import { StudentQuizList } from "./components/student/StudentQuizList";
import { StudentQuizTake } from "./components/student/StudentQuizTake";
import { AdminQuizDashboard } from "./components/admin/AdminQuizDashboard";
import { StudentApprovals } from "./components/admin/StudentApprovals";
import { NotFound } from "./components/NotFound";
import { StudentAuth } from "./components/auth/StudentAuth"; // Ensure this import exists

// Wrapper component for protected student routes
function ProtectedStudentLayout() {
  return (
    <ProtectedRoute>
      <StudentLayout />
    </ProtectedRoute>
  );
}

// Wrapper component for protected teacher routes
function ProtectedTeacherLayout() {
  return (
    <ProtectedTeacherRoute>
      <TeacherLayout />
    </ProtectedTeacherRoute>
  );
}

export function createRouterForRole(role: 'admin' | 'teacher' | 'student') {
  if (role === 'student') {
    return createBrowserRouter([
      {
        path: "/auth",
        Component: StudentAuth, // Publicly accessible
      },
      {
        path: "/",
        Component: ProtectedStudentLayout,
        children: [
          { index: true, Component: StudentPortal },
          { path: "courses", Component: Courses },
          { path: "materials", Component: StudyMaterials },
          { path: "quizzes", Component: StudentQuizList },
          { path: "quiz/:id", Component: StudentQuizTake },
          { path: "*", Component: NotFound },
        ],
      },
    ]);
  }

  if (role === 'teacher') {
    return createBrowserRouter([
      {
        path: "/auth",
        Component: StudentAuth, // Teachers can also use the same auth page
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
          { path: "quizzes", Component: TeacherQuizManagement },
          { path: "quiz-monitor/:id", Component: TeacherQuizMonitor },
          { path: "grading", Component: AutoGrading },
          { path: "performance-levels", Component: PerformanceLevels },
          { path: "analytics", Component: Analytics },
          { path: "notifications", Component: TeacherNotifications },
          { path: "*", Component: NotFound },
        ],
      },
    ]);
  }
  

  // Admin routes
  return createBrowserRouter([
    {
      path: "/auth",
      Component: StudentAuth,
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
        { path: "quizzes", Component: AdminQuizDashboard },
        { path: "grading", Component: AutoGrading },
        { path: "performance-levels", Component: PerformanceLevels },
        { path: "analytics", Component: Analytics },
        { path: "*", Component: NotFound },
      ],
    },
  ]);
}
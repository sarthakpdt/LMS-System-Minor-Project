# Implementation Plan - ERP-LMS AI Timetable Generator V2 (Production Grade)

This implementation plan outlines the steps, code changes, and verification routines to upgrade the ERP timetable module into a fully integrated, production-grade scheduling engine.

## User Review Required

> [!IMPORTANT]
> - **Zero Prohibited File Changes**: We do not need to modify any files in the prohibited list. All backend algorithm extensions (room capacity checks, AI clash resolution tips) will be implemented as post-processing helpers inside `timetableController.js` and `attendanceController.js`.
> - **Automatic Attendance Slots**: Instead of pre-generating thousands of blank attendance records, attendance slots will resolve dynamically from the active `TtPublished` timetable collection. If a slot is scheduled on a given day/time, it will dynamically appear on the teacher's attendance taker page for that date.
> - **Section Automation**: The list of students for attendance taking will query the `Student` collection dynamically based on `department/timetableBranch`, `semester`, and `section`, rather than using a static course enrollment list, so updates by the admin propagate instantly.

---

## Proposed Changes

### Component 1: Backend Controllers & APIs

#### [MODIFY] [timetableController.js](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/backend/controllers/timetableController.js)
- Extend `generateTimetable` to run a post-generation validation step that checks room capacity vs. section student count.
- Implement AI Clash Resolution engine: For every error/warning conflict, the engine will search for alternative slots where both resources (faculty and room) are free, generating actionable "move/swap" recommendations.
- Add `cloneSemesterStructure` controller to duplicate subject configurations from one semester to another (e.g., Sem 3 → Sem 5), preserving faculty workloads and settings while renaming subject codes.
- Add `recommendBestSlots` controller: Implement AI slot prediction that scores potential time slots based on faculty constraints, historical attendance patterns (lower attendance early morning/late afternoon), and balanced student load (preventing consecutive heavy subjects).
- Add `getRoomUtilization` and `getFacultyWorkload` analytics endpoints: Summarize occupancy percentages, list free classrooms/labs, identify teacher daily loads, detect gap violations, and output data formats for Recharts.
- Extend `updateTimetable` to re-run validation on manual entry modifications and update the draft.

#### [MODIFY] [attendanceController.js](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/backend/controllers/attendanceController.js)
- Modify `getStudents` to query `Student` dynamically by matching `department`, `semester`, and `section` instead of relying on the course's static `enrolledStudents` array, achieving automated student list updates when admins change a student's section.

---

### Component 2: Frontend Timetable Canvas & Pages

#### [MODIFY] [TimetableGrid.tsx](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/frontend/src/components/timetable/TimetableGrid.tsx)
- Re-architect the schedule matrix to support premium modern SaaS styling:
  - Render color-coded cards for cell content:
    - **Theory**: Blue gradient border + light blue fill
    - **Lab**: Green gradient border + light green fill
    - **Tutorial**: Yellow gradient border + light yellow fill
    - **Exam**: Red gradient border + light red fill
    - **Break**: Purple border + light purple fill
    - **Free/Cancelled**: Dashed gray border + light gray fill
  - Make cards interactive: Clicking a card opens the **Edit / Swap / Move Period** drawer or dialog.
  - Support drag-and-drop: Use HTML5 drag-and-drop or simple click-to-move interactions to swap or reschedule periods.

#### [MODIFY] [TimetableGenerator.tsx](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/frontend/src/components/timetable/TimetableGenerator.tsx)
- Add interactive controls to the preview step:
  - Add **AI Clash Resolution panel**: Display warning cards detailing detected conflicts alongside click-to-apply buttons for AI-generated recommendations.
  - Implement a **Swap Dialog** where the admin can select two cards and instantly swap their slots.
  - Implement an **Edit Dialog** to edit slot parameters (change subject, teacher, room, section) on-the-fly.
  - Incorporate **Export Options**: Generate a printable PDF view, download Excel files, or download CSV schedules.
  - Add a **Clone Semester button**: Trigger a modal allowing configuration structures to be cloned.

#### [MODIFY] [TimetableDashboard.tsx](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/frontend/src/components/timetable/TimetableDashboard.tsx)
- Add a new tab: **Analytics & Workloads**
  - Render Recharts Room Occupancy heatmaps and unused lab metrics.
  - Render Recharts Faculty Workload histograms showing weekly lecture hours and gap distributions.
  - Integrate this Timetable Suite into the main Admin Dashboard view, replacing the manual list editor.

---

### Component 3: Portals Integration (Teacher & Student)

#### [MODIFY] [Dashboard.tsx](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/frontend/src/components/Dashboard.tsx)
- In the `TeacherDashboard` view:
  - Fetch published schedules using `api.getPublished({ facultyId: user.id })`.
  - Render a clean timeline card for "Today's Schedule" (showing active class, course, room, section, time) and a weekly grid.
  - If a teacher has a class right now, show a prominent quick-link "Take Attendance" button.

#### [MODIFY] [StudentPortalNew.tsx](file:///c:/Users/Lenovo/Downloads/LMS-System-Minor-Project/LMS-System-Minor-Project/frontend/src/components/StudentPortalNew.tsx)
- Add a **My Timetable** tab to the Student Portal:
  - Fetch published schedules using `api.getPublishedForStudent(user.id)`.
  - Display the student's daily classes and weekly schedule matrix using `TimetableGrid`.
  - Include an "Upcoming Class" indicator on the home overview dashboard.

---

## Verification Plan

### Automated Tests
We will verify API health and responses:
1. Start the backend Node server and verify database connection.
2. Test critical endpoints using a PowerShell shell command or manual API calls:
   - `GET http://localhost:5000/api/timetable/engine/config`
   - `POST http://localhost:5000/api/timetable/engine/generate`
   - `GET http://localhost:5000/api/attendance/students`

### Manual Verification
1. Open the Admin Panel, navigate to **Timetable Manager**, and complete the multi-step configuration (set up days, branches, rooms, teacher constraints).
2. Generate a timetable draft, verify the interactive preview canvas, click a card to swap slots, verify the conflict list updates, and apply an AI clash resolution tip.
3. Save the draft, then click **Publish**.
4. Log in as a teacher assigned to a slot, verify the schedule is shown on the Teacher Dashboard, click "Take Attendance", and verify the student list matches the section.
5. Log in as a student in that section, verify that their portal displays their weekly timetable and next upcoming class.

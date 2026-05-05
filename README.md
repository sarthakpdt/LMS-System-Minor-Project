# 📚 LMS System — Academic Performance Evaluator

A full-stack, role-based **Learning Management System (LMS)** built with React, Node.js, and MongoDB. It offers separate dashboards for **Admins**, **Faculty (Teachers)**, and **Students**, with features like AI-powered performance analysis, quiz management, automated grading, plagiarism detection, attendance tracking, and real-time analytics — all in one platform.

---

## 👥 Team

| Name | Role |
|------|------|
| **Sarthak Pandit** | Frontend — Dashboards, AI Assistant, Quiz System, Performance Levels, Assignments |
| **Tushar** | Backend — Auth, Routes, Database Structure, API Design |

---

## 📌 Project Duration

**1 January 2026 – 15 May 2026**

---

## 🧠 About the Project

This LMS was built as a Minor Project to simulate a real-world academic management platform. The system handles the complete lifecycle of a student — from registration and approval to course enrollment, quiz-taking, assignment submission, performance tracking, and AI-generated feedback on their learning progress.

---

## ✨ Key Features

### 🔐 Authentication & Role-Based Access
- Separate login for **Admin**, **Teacher**, and **Student**
- JWT-based authentication with protected routes
- Student registration goes through an **Admin Approval Workflow** (Pending → Approved / Rejected)
- Passwords hashed using **bcryptjs**

### 🎓 Student Portal
- View enrolled courses, study materials, and timetable
- Take quizzes with live timer and auto-submission
- Submit assignments as **PDF uploads**
- Track personal performance with subject-wise scores
- **Star-based performance levels** (Bronze → Silver → Gold → Platinum)
- **AI Learning Assistant** — analyzes quiz results + assignment scores and gives:
  - Strengths, Weak Areas, Needs Improvement classification
  - Suggested topics to study
  - Improvement tips
  - Overall status: Needs Attention / On Track / Excellent

### 👨‍🏫 Faculty (Teacher) Dashboard
- Manage students, marks, and attendance
- Create and manage **Courses** and **Study Materials**
- Create quizzes with **AI-generated question suggestions**
- Monitor live quiz attempts via **Quiz Monitor**
- Enter subject-wise marks for students
- Manage **Assignments** — create, view submissions, grade them
- View **Performance Levels** and **Bucket Dashboard**
- Send **Notifications** to students
- View **Analytics** with bar and line charts

### 🛠️ Admin Dashboard
- Approve or reject new student registrations
- Manage all courses, study materials, and assessments
- Access quiz dashboard across all students
- Auto-grading management
- Platform-wide analytics and performance overview

### 📝 Quiz System
- Teachers create quizzes with multiple questions
- **AI suggests questions** based on subject/topic (Gemini AI)
- Students take quizzes with a countdown timer
- Results are auto-evaluated and stored
- Teachers can monitor ongoing attempts in real time

### 📄 Assignment System
- Teachers create assignments with questions
- Students upload PDF answers
- **Plagiarism Detection** using Jaccard Similarity
- Auto-grading with letter grades (A+, A, B, C, D, F)
- Teachers can view all submissions and scores

### 📊 Analytics & Performance
- Visual charts (Bar + Line) using **Recharts**
- Subject-wise performance breakdown
- Attendance tracking and reporting
- Student bucket system — groups students by performance range

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI Framework |
| TypeScript | Type-safe development |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Recharts | Analytics charts |
| Tailwind CSS | Styling |
| Radix UI + shadcn/ui | Component library |
| Lucide React | Icons |
| React Hook Form | Form management |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express.js v5 | REST API framework |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | PDF file uploads |
| pdf-parse | Extract text from PDFs |
| Nodemon | Dev auto-restart |
| dotenv | Environment config |

### AI Integration
| Technology | Purpose |
|-----------|---------|
| Google Gemini AI | Quiz suggestions + learning feedback |

---

## 📁 Project Structure
```
LMS-System-Minor-Project/
│
├── backend/
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── assignmentController.js
│   │   ├── authController.js
│   │   ├── bucketController.js
│   │   ├── courseController.js
│   │   └── quizController.js
│   │
│   ├── models/
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Admin.js
│   │   ├── Course.js
│   │   ├── Quiz.js
│   │   ├── QuizResult.js
│   │   ├── Assignment.js
│   │   ├── Attendance.js
│   │   ├── Material.js
│   │   ├── Notification.js
│   │   ├── Timetable.js
│   │   └── StudentBucket.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── materials.js
│   │   ├── attendance1.js
│   │   ├── notifications.js
│   │   ├── timetable.js
│   │   └── bucketRoutes.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── data/
│   │   └── semesterSubjects.js
│   │
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   ├── auth/
│   │   │   ├── layouts/
│   │   │   ├── ui/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Courses.tsx
│   │   │   ├── Assignments.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── StudyMaterials.tsx
│   │   │   ├── AutoGrading.tsx
│   │   │   └── PerformanceLevels.tsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── RoleContext.tsx
│   │   │
│   │   ├── routes.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
└── README.me
```
---

## 🗄️ Database Structure

**Database Name:** `SchoolData`

| Collection | Purpose |
|-----------|---------|
| Students | Profile, enrollment, approval status, GPA |
| Teachers | Profile, assigned courses, department |
| Admins | Admin profile and permissions |
| Courses | Course details and enrolled students |
| Quizzes | Questions, answers, time limits |
| QuizResults | Student scores per quiz |
| Assignments | Questions, PDF submissions, grades, plagiarism scores |
| Attendance | Date-wise student attendance records |
| Materials | Uploaded study resources per course |
| Notifications | Teacher-to-student messages |
| Timetable | Class schedule per semester |
| StudentBuckets | Performance-based student groupings |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/sarthakpdt/LMS-System-Minor-Project.git
cd LMS-System-Minor-Project
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the server:

```bash
node server.js
```

> Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs at: `http://localhost:5173`

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/student/signup` | Student registration |
| POST | `/api/auth/student/login` | Student login |
| POST | `/api/auth/teacher/login` | Teacher login |
| GET | `/api/admin/students` | Get all students |
| PUT | `/api/admin/students/:id/approve` | Approve student |
| GET | `/api/quizzes` | Get all quizzes |
| POST | `/api/quizzes` | Create quiz |
| GET | `/api/quizzes/results/student/:id` | Student quiz results |
| POST | `/api/assignments` | Create assignment |
| POST | `/api/assignments/:id/submit` | Submit assignment PDF |
| GET | `/api/admin/courses` | Get all courses |
| GET | `/api/notifications` | Get notifications |

---

## 🤖 AI Features

### AI Learning Assistant (Student)
Fetches the student's quiz scores and assignment grades, sends them to **Gemini AI**, and returns:
- Subject-wise classification: **Strong Area / Needs Improvement / Weak Area**
- Suggested topics to focus on
- Personalized improvement tips
- Priority action item

### AI Quiz Question Suggestions (Teacher)
- Teacher inputs a subject or topic
- Gemini AI generates relevant MCQ questions
- Teacher picks and adds them directly to a quiz

---

## 📊 Feature Access Matrix

| Feature | Admin | Teacher | Student |
|---------|:-----:|:-------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ |
| Manage Students | ✅ | ✅ | ❌ |
| Approve Students | ✅ | ❌ | ❌ |
| Manage Courses | ✅ | ✅ | View only |
| Upload Study Materials | ✅ | ✅ | View only |
| Create Quizzes | ✅ | ✅ | ❌ |
| Take Quizzes | ❌ | ❌ | ✅ |
| Submit Assignments (PDF) | ❌ | ❌ | ✅ |
| Grade Assignments | ✅ | ✅ | ❌ |
| Plagiarism Detection | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ❌ |
| AI Learning Assistant | ❌ | ❌ | ✅ |
| AI Quiz Suggestions | ❌ | ✅ | ❌ |
| Send Notifications | ❌ | ✅ | ❌ |
| Attendance Management | ✅ | ✅ | View only |
| Performance Levels | ✅ | ✅ | ✅ |

---

## 🌟 Performance Level System

| Level | Score Range | Status |
|-------|------------|--------|
| 🥉 Bronze | 0 – 49% | Needs Attention |
| 🥈 Silver | 50 – 69% | On Track |
| 🥇 Gold | 70 – 84% | Good Performance |
| 💎 Platinum | 85 – 100% | Excellent |

---

## 🛡️ Security

- JWT token-based authentication
- Role-based route protection
- Password hashing with bcryptjs
- File upload validation (PDF only, max 10MB)
- Plagiarism detection using Jaccard Similarity algorithm

---

## 🙏 Acknowledgements

- [Google Gemini AI](https://ai.google.dev/) — AI-powered features
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Recharts](https://recharts.org/) — Data visualization
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Cloud database
- [Radix UI](https://www.radix-ui.com/) — Accessible components

---

*Built with ❤️ by Sarthak Pandit & Tushar*

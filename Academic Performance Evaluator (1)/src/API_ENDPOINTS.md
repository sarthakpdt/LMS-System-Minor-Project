# API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "studentId": "STU001",
  "department": "Computer Science",
  "semester": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student"
    },
    "profile": {
      "studentId": "STU001",
      "department": "Computer Science",
      "semester": 3,
      "level": "Beginner"
    }
  }
}
```

---

### 4. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer {token}
```

---

## Student Endpoints

### 1. Get Student Dashboard
```
GET /api/students/dashboard
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "studentId": "STU001",
      "level": "Intermediate",
      "performanceMetrics": {
        "totalQuizzesTaken": 15,
        "averageScore": 78.5,
        "consecutiveHighScores": 3
      }
    },
    "enrolledCourses": [
      {
        "_id": "course123",
        "courseCode": "CS101",
        "courseName": "Data Structures",
        "credits": 4
      }
    ],
    "upcomingQuizzes": [
      {
        "_id": "quiz123",
        "title": "Midterm Quiz",
        "courseCode": "CS101",
        "startTime": "2026-02-20T10:00:00Z",
        "duration": 60
      }
    ],
    "recentGrades": [
      {
        "courseCode": "CS101",
        "assessmentType": "quiz",
        "marksObtained": 85,
        "totalMarks": 100,
        "percentage": 85
      }
    ]
  }
}
```

---

### 2. Get Available Quizzes
```
GET /api/students/quizzes/available
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "_id": "quiz123",
        "title": "Arrays and Linked Lists",
        "courseCode": "CS101",
        "courseName": "Data Structures",
        "duration": 45,
        "totalMarks": 50,
        "startTime": "2026-02-20T10:00:00Z",
        "endTime": "2026-02-20T18:00:00Z",
        "status": "published",
        "isAttempted": false
      }
    ]
  }
}
```

---

### 3. Start Quiz Attempt
```
POST /api/students/quizzes/:quizId/start
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt123",
    "quiz": {
      "_id": "quiz123",
      "title": "Arrays and Linked Lists",
      "duration": 45,
      "totalMarks": 50,
      "questions": [
        {
          "_id": "q1",
          "questionText": "What is a linked list?",
          "questionType": "mcq",
          "options": ["A", "B", "C", "D"],
          "marks": 5
        }
      ]
    },
    "startedAt": "2026-02-20T10:05:00Z",
    "endsAt": "2026-02-20T10:50:00Z"
  }
}
```

---

### 4. Submit Quiz Answer
```
POST /api/students/quizzes/attempts/:attemptId/answer
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "questionId": "q1",
  "answer": "Option A",
  "timeSpent": 120
}
```

---

### 5. Submit Quiz
```
POST /api/students/quizzes/attempts/:attemptId/submit
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt123",
    "score": 42,
    "totalMarks": 50,
    "percentage": 84,
    "passed": true,
    "feedback": "Great job!",
    "levelPromotion": {
      "promoted": true,
      "newLevel": "Intermediate",
      "previousLevel": "Beginner"
    }
  }
}
```

---

### 6. Log Tab Switch
```
POST /api/students/quizzes/attempts/:attemptId/tab-switch
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "timestamp": "2026-02-20T10:15:00Z"
}
```

---

### 7. Get Student Grades
```
GET /api/students/grades
Headers: Authorization: Bearer {token}
Query Parameters: ?courseId=course123&semester=3
```

**Response:**
```json
{
  "success": true,
  "data": {
    "grades": [
      {
        "courseCode": "CS101",
        "courseName": "Data Structures",
        "assessments": [
          {
            "assessmentType": "quiz",
            "marksObtained": 85,
            "totalMarks": 100,
            "percentage": 85,
            "gradedAt": "2026-02-15T12:00:00Z"
          }
        ],
        "overallGrade": {
          "percentage": 82.5,
          "letterGrade": "A",
          "gpa": 4.0
        }
      }
    ]
  }
}
```

---

### 8. Get Study Materials
```
GET /api/students/courses/:courseId/materials
Headers: Authorization: Bearer {token}
```

---

### 9. Get Notifications
```
GET /api/students/notifications
Headers: Authorization: Bearer {token}
Query Parameters: ?unreadOnly=true&priority=high
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notif123",
        "type": "quiz",
        "priority": "high",
        "title": "New Quiz Available",
        "message": "A new quiz has been published for CS101",
        "actionRequired": true,
        "actionUrl": "/student/quizzes/quiz123",
        "isRead": false,
        "createdAt": "2026-02-14T08:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### 10. Mark Notification as Read
```
PUT /api/students/notifications/:notificationId/read
Headers: Authorization: Bearer {token}
```

---

## Teacher Endpoints

### 1. Get Teacher Dashboard
```
GET /api/teachers/dashboard
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teacher": {
      "teacherId": "TCH001",
      "department": "Computer Science"
    },
    "assignedCourses": [
      {
        "_id": "course123",
        "courseCode": "CS101",
        "courseName": "Data Structures",
        "enrolledStudents": 45
      }
    ],
    "activeQuizzes": [
      {
        "_id": "quiz123",
        "title": "Midterm Quiz",
        "courseCode": "CS101",
        "status": "published",
        "totalAttempts": 38
      }
    ],
    "pendingGrading": 12
  }
}
```

---

### 2. Create Quiz
```
POST /api/teachers/quizzes
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "courseId": "course123",
  "title": "Arrays and Linked Lists Quiz",
  "description": "Test your knowledge on basic data structures",
  "duration": 45,
  "totalMarks": 50,
  "passingMarks": 25,
  "startTime": "2026-02-20T10:00:00Z",
  "endTime": "2026-02-20T18:00:00Z",
  "antiCheatSettings": {
    "enableTabSwitchDetection": true,
    "maxTabSwitches": 3,
    "enableCopyPasteBlock": true,
    "randomizeQuestions": true
  },
  "questions": [
    {
      "questionText": "What is a linked list?",
      "questionType": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "marks": 5,
      "difficulty": "easy"
    }
  ]
}
```

---

### 3. Update Quiz
```
PUT /api/teachers/quizzes/:quizId
Headers: Authorization: Bearer {token}
```

---

### 4. Delete Quiz
```
DELETE /api/teachers/quizzes/:quizId
Headers: Authorization: Bearer {token}
```

---

### 5. Publish Quiz
```
PUT /api/teachers/quizzes/:quizId/publish
Headers: Authorization: Bearer {token}
```

---

### 6. Get Quiz Results
```
GET /api/teachers/quizzes/:quizId/results
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "title": "Arrays and Linked Lists",
      "totalMarks": 50,
      "totalAttempts": 42
    },
    "results": [
      {
        "studentId": "STU001",
        "studentName": "John Doe",
        "score": 45,
        "percentage": 90,
        "submittedAt": "2026-02-20T10:45:00Z",
        "antiCheatFlags": {
          "isFlagged": true,
          "tabSwitches": 5
        }
      }
    ],
    "statistics": {
      "averageScore": 38.5,
      "highestScore": 50,
      "lowestScore": 15,
      "passRate": 85.7
    }
  }
}
```

---

### 7. Get Student Grades by Subject
```
GET /api/teachers/grades/subject/:courseId
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "courseCode": "CS101",
      "courseName": "Data Structures"
    },
    "students": [
      {
        "studentId": "STU001",
        "studentName": "John Doe",
        "level": "Intermediate",
        "assessments": [
          {
            "type": "quiz",
            "marksObtained": 45,
            "totalMarks": 50,
            "percentage": 90
          }
        ],
        "overallPercentage": 85.5,
        "letterGrade": "A"
      }
    ]
  }
}
```

---

### 8. Get All Students Grades (Cross-Subject)
```
GET /api/teachers/grades/all
Headers: Authorization: Bearer {token}
```

---

### 9. Create Assignment
```
POST /api/teachers/assignments
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "courseId": "course123",
  "title": "Implement Binary Search Tree",
  "description": "Create a BST with insert, delete, and search operations",
  "totalMarks": 100,
  "dueDate": "2026-02-28T23:59:59Z",
  "allowLateSubmission": true,
  "lateSubmissionPenalty": 10
}
```

---

### 10. Grade Assignment
```
PUT /api/teachers/assignments/:assignmentId/submissions/:studentId/grade
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "marksAwarded": 85,
  "remarks": "Good implementation, minor optimization issues"
}
```

---

### 11. Upload Study Material
```
POST /api/teachers/courses/:courseId/materials
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
title: "Lecture 5 - Trees"
type: "pdf"
file: <binary>
```

---

### 12. Send Notification
```
POST /api/teachers/notifications/send
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "courseId": "course123",
  "type": "announcement",
  "priority": "high",
  "title": "Class Rescheduled",
  "message": "Tomorrow's class is moved to 2 PM",
  "actionRequired": false
}
```

---

### 13. Get Flagged Quiz Attempts
```
GET /api/teachers/quizzes/flagged-attempts
Headers: Authorization: Bearer {token}
```

---

### 14. View Student Performance Analytics
```
GET /api/teachers/analytics/student/:studentId
Headers: Authorization: Bearer {token}
```

---

## Admin Endpoints

### 1. Get Admin Dashboard
```
GET /api/admin/dashboard
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalStudents": 1250,
      "totalTeachers": 85,
      "totalCourses": 120,
      "activeQuizzes": 45
    },
    "levelDistribution": {
      "Beginner": 520,
      "Intermediate": 480,
      "Advanced": 250
    },
    "recentActivities": []
  }
}
```

---

### 2. Create User
```
POST /api/admin/users
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "email": "newteacher@example.com",
  "password": "tempPassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "teacher",
  "teacherId": "TCH042",
  "department": "Mathematics"
}
```

---

### 3. Get All Users
```
GET /api/admin/users
Headers: Authorization: Bearer {token}
Query Parameters: ?role=student&department=Computer Science&page=1&limit=20
```

---

### 4. Update User
```
PUT /api/admin/users/:userId
Headers: Authorization: Bearer {token}
```

---

### 5. Delete User
```
DELETE /api/admin/users/:userId
Headers: Authorization: Bearer {token}
```

---

### 6. Create Course
```
POST /api/admin/courses
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "courseCode": "CS301",
  "courseName": "Database Systems",
  "description": "Advanced database concepts",
  "department": "Computer Science",
  "semester": 5,
  "credits": 4,
  "teacherId": "teacher123"
}
```

---

### 7. Assign Teacher to Course
```
PUT /api/admin/courses/:courseId/assign-teacher
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "teacherId": "teacher123"
}
```

---

### 8. Enroll Student in Course
```
POST /api/admin/courses/:courseId/enroll
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "studentId": "student123"
}
```

---

### 9. Get System Analytics
```
GET /api/admin/analytics
Headers: Authorization: Bearer {token}
Query Parameters: ?startDate=2026-01-01&endDate=2026-02-14
```

---

### 10. Manage Level Promotions
```
GET /api/admin/level-promotions
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "studentId": "STU001",
        "studentName": "John Doe",
        "previousLevel": "Beginner",
        "newLevel": "Intermediate",
        "promotedAt": "2026-02-10T15:30:00Z",
        "reason": "Consecutive high scores",
        "isAutomatic": true
      }
    ]
  }
}
```

---

### 11. Override Student Level
```
PUT /api/admin/students/:studentId/level
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "newLevel": "Advanced",
  "reason": "Exceptional performance in coding competition"
}
```

---

### 12. View Anti-Cheat Reports
```
GET /api/admin/anti-cheat/reports
Headers: Authorization: Bearer {token}
Query Parameters: ?flaggedOnly=true
```

---

### 13. Generate Reports
```
POST /api/admin/reports/generate
Headers: Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reportType": "performance",
  "startDate": "2026-01-01",
  "endDate": "2026-02-14",
  "department": "Computer Science",
  "format": "pdf"
}
```

---

## Common Query Parameters

Most GET endpoints support:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sort`: Sort field (e.g., `createdAt`, `-score` for descending)
- `search`: Search term

---

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Server Error

---

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires after 7 days (configurable in `.env`).

---

## Real-time Events (Socket.io)

### Client Connection
```javascript
const socket = io('http://localhost:5000');

// Join user-specific room
socket.emit('join', userId);
```

### Events Emitted by Server

#### New Notification
```javascript
socket.on('notification:new', (data) => {
  // data structure:
  {
    _id: "notif123",
    type: "quiz",
    title: "New Quiz Available",
    message: "...",
    priority: "high"
  }
});
```

#### Quiz Published
```javascript
socket.on('quiz:published', (data) => {
  // Quiz details
});
```

#### Grade Updated
```javascript
socket.on('grade:updated', (data) => {
  // Grade information
});
```

#### Level Promotion
```javascript
socket.on('level:promoted', (data) => {
  {
    newLevel: "Intermediate",
    previousLevel: "Beginner"
  }
});
```

---

For complete controller implementations, see CONTROLLERS.md

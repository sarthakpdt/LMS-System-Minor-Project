# Backend Setup Guide for Academic Performance LMS

## Technology Stack
- **Database**: MongoDB
- **Backend Framework**: Node.js + Express
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io for notifications
- **File Storage**: GridFS or cloud storage (AWS S3/Cloudinary)

---

## MongoDB Database Schema

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['admin', 'teacher', 'student'], required),
  firstName: String (required),
  lastName: String (required),
  profileImage: String (URL),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean (default: true),
  lastLogin: Date
}
```

### 2. Students Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'Users', required),
  studentId: String (unique, required),
  department: String (required),
  semester: Number (required),
  level: String (enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner'),
  enrolledCourses: [
    {
      courseId: ObjectId (ref: 'Courses'),
      enrolledAt: Date,
      status: String (enum: ['active', 'completed', 'dropped'])
    }
  ],
  performanceMetrics: {
    totalQuizzesTaken: Number (default: 0),
    averageScore: Number (default: 0),
    consecutiveHighScores: Number (default: 0),
    lastLevelUpdate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Teachers Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'Users', required),
  teacherId: String (unique, required),
  department: String (required),
  specialization: String,
  assignedCourses: [
    {
      courseId: ObjectId (ref: 'Courses'),
      assignedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Courses Collection
```javascript
{
  _id: ObjectId,
  courseCode: String (unique, required),
  courseName: String (required),
  description: String,
  department: String (required),
  semester: Number (required),
  credits: Number (required),
  teacherId: ObjectId (ref: 'Teachers'),
  syllabus: String,
  studyMaterials: [
    {
      _id: ObjectId,
      title: String,
      type: String (enum: ['pdf', 'video', 'document', 'link']),
      url: String,
      uploadedAt: Date,
      size: Number
    }
  ],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Quizzes Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Courses', required),
  teacherId: ObjectId (ref: 'Teachers', required),
  title: String (required),
  description: String,
  duration: Number (minutes, required),
  totalMarks: Number (required),
  passingMarks: Number (required),
  startTime: Date (required),
  endTime: Date (required),
  isProctored: Boolean (default: true),
  antiCheatSettings: {
    enableTabSwitchDetection: Boolean (default: true),
    enableCopyPasteBlock: Boolean (default: true),
    maxTabSwitches: Number (default: 3),
    enableWebcam: Boolean (default: false),
    randomizeQuestions: Boolean (default: true)
  },
  questions: [
    {
      _id: ObjectId,
      questionText: String (required),
      questionType: String (enum: ['mcq', 'multiple', 'true-false', 'short-answer']),
      options: [String], // For MCQ and multiple choice
      correctAnswer: Mixed, // String for MCQ/True-False, Array for multiple, String for short
      marks: Number (required),
      difficulty: String (enum: ['easy', 'medium', 'hard']),
      order: Number
    }
  ],
  status: String (enum: ['draft', 'published', 'completed', 'archived'], default: 'draft'),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Quiz Attempts Collection
```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: 'Quizzes', required),
  studentId: ObjectId (ref: 'Students', required),
  courseId: ObjectId (ref: 'Courses', required),
  startedAt: Date (required),
  submittedAt: Date,
  answers: [
    {
      questionId: ObjectId,
      answer: Mixed,
      isCorrect: Boolean,
      marksAwarded: Number,
      timeSpent: Number (seconds)
    }
  ],
  score: Number,
  percentage: Number,
  status: String (enum: ['in-progress', 'submitted', 'auto-submitted', 'abandoned']),
  antiCheatLog: {
    tabSwitches: Number (default: 0),
    tabSwitchTimestamps: [Date],
    copyPasteAttempts: Number (default: 0),
    suspiciousActivity: [
      {
        type: String,
        timestamp: Date,
        details: String
      }
    ],
    isFlagged: Boolean (default: false)
  },
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Grades Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: 'Students', required),
  courseId: ObjectId (ref: 'Courses', required),
  assessments: [
    {
      assessmentId: ObjectId, // Could be quizId or assignmentId
      assessmentType: String (enum: ['quiz', 'assignment', 'midterm', 'final']),
      marksObtained: Number,
      totalMarks: Number,
      percentage: Number,
      submittedAt: Date,
      gradedAt: Date,
      gradedBy: ObjectId (ref: 'Teachers')
    }
  ],
  overallGrade: {
    totalMarks: Number,
    marksObtained: Number,
    percentage: Number,
    letterGrade: String (enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
    gpa: Number
  },
  semester: Number,
  academicYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Notifications Collection
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: 'Users', required),
  recipientRole: String (enum: ['admin', 'teacher', 'student']),
  senderId: ObjectId (ref: 'Users'),
  type: String (enum: ['assignment', 'quiz', 'grade', 'announcement', 'system', 'deadline']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  title: String (required),
  message: String (required),
  actionRequired: Boolean (default: false),
  actionUrl: String,
  relatedEntity: {
    entityType: String (enum: ['quiz', 'assignment', 'course', 'announcement']),
    entityId: ObjectId
  },
  isRead: Boolean (default: false),
  readAt: Date,
  createdAt: Date,
  expiresAt: Date
}
```

### 9. Assignments Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Courses', required),
  teacherId: ObjectId (ref: 'Teachers', required),
  title: String (required),
  description: String (required),
  instructions: String,
  totalMarks: Number (required),
  dueDate: Date (required),
  allowLateSubmission: Boolean (default: false),
  lateSubmissionPenalty: Number (percentage),
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      uploadedAt: Date
    }
  ],
  submissions: [
    {
      studentId: ObjectId (ref: 'Students'),
      submittedAt: Date,
      files: [
        {
          fileName: String,
          fileUrl: String,
          fileSize: Number
        }
      ],
      remarks: String,
      marksAwarded: Number,
      gradedAt: Date,
      gradedBy: ObjectId (ref: 'Teachers'),
      isLate: Boolean
    }
  ],
  status: String (enum: ['draft', 'published', 'closed'], default: 'draft'),
  createdAt: Date,
  updatedAt: Date
}
```

### 10. Attendance Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Courses', required),
  teacherId: ObjectId (ref: 'Teachers', required),
  date: Date (required),
  sessionType: String (enum: ['lecture', 'lab', 'tutorial']),
  attendanceRecords: [
    {
      studentId: ObjectId (ref: 'Students'),
      status: String (enum: ['present', 'absent', 'late', 'excused']),
      markedAt: Date,
      remarks: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### 11. Announcements Collection
```javascript
{
  _id: ObjectId,
  createdBy: ObjectId (ref: 'Users', required),
  creatorRole: String (enum: ['admin', 'teacher']),
  title: String (required),
  content: String (required),
  targetAudience: {
    role: String (enum: ['all', 'students', 'teachers']),
    courses: [ObjectId], // Specific courses if applicable
    departments: [String],
    semesters: [Number]
  },
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  attachments: [
    {
      fileName: String,
      fileUrl: String
    }
  ],
  isActive: Boolean (default: true),
  publishedAt: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 12. Level Promotions Log
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: 'Students', required),
  previousLevel: String,
  newLevel: String,
  promotedAt: Date,
  reason: String,
  triggerMetrics: {
    consecutiveHighScores: Number,
    averageScore: Number,
    totalQuizzesTaken: Number
  },
  isAutomatic: Boolean (default: true),
  createdAt: Date
}
```

---

## MongoDB Indexes

Create these indexes for optimal performance:

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Students Collection
db.students.createIndex({ userId: 1 }, { unique: true });
db.students.createIndex({ studentId: 1 }, { unique: true });
db.students.createIndex({ level: 1 });
db.students.createIndex({ 'enrolledCourses.courseId': 1 });

// Teachers Collection
db.teachers.createIndex({ userId: 1 }, { unique: true });
db.teachers.createIndex({ teacherId: 1 }, { unique: true });
db.teachers.createIndex({ 'assignedCourses.courseId': 1 });

// Courses Collection
db.courses.createIndex({ courseCode: 1 }, { unique: true });
db.courses.createIndex({ teacherId: 1 });
db.courses.createIndex({ department: 1, semester: 1 });

// Quizzes Collection
db.quizzes.createIndex({ courseId: 1 });
db.quizzes.createIndex({ teacherId: 1 });
db.quizzes.createIndex({ status: 1 });
db.quizzes.createIndex({ startTime: 1, endTime: 1 });

// Quiz Attempts Collection
db.quizAttempts.createIndex({ quizId: 1, studentId: 1 });
db.quizAttempts.createIndex({ studentId: 1, status: 1 });
db.quizAttempts.createIndex({ courseId: 1 });
db.quizAttempts.createIndex({ 'antiCheatLog.isFlagged': 1 });

// Grades Collection
db.grades.createIndex({ studentId: 1, courseId: 1 }, { unique: true });
db.grades.createIndex({ courseId: 1 });

// Notifications Collection
db.notifications.createIndex({ recipientId: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Assignments Collection
db.assignments.createIndex({ courseId: 1 });
db.assignments.createIndex({ teacherId: 1 });
db.assignments.createIndex({ dueDate: 1 });

// Attendance Collection
db.attendance.createIndex({ courseId: 1, date: 1 });
db.attendance.createIndex({ 'attendanceRecords.studentId': 1 });

// Announcements Collection
db.announcements.createIndex({ createdAt: -1 });
db.announcements.createIndex({ isActive: 1 });
```

---

## Environment Variables

Create a `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lms_database
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms_database

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Bcrypt
BCRYPT_ROUNDS=10

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# AWS S3 (Optional for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@lms.com

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Next Steps

1. Install MongoDB locally or use MongoDB Atlas
2. Set up Node.js backend project (see SERVER_CODE.md)
3. Implement API endpoints (see API_ENDPOINTS.md)
4. Configure authentication and authorization
5. Set up Socket.io for real-time notifications
6. Implement file upload handling
7. Connect frontend to backend API

Refer to the other backend documentation files for implementation details.

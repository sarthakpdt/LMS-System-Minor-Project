# Middleware and Routes Implementation

## Middleware

### `/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};
```

---

### `/src/middleware/roleCheck.js`

```javascript
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
```

---

### `/src/middleware/errorHandler.js`

```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 422 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
```

---

### `/src/middleware/validation.js`

```javascript
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
};
```

---

### `/src/middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
});

// Quiz submission limiter
exports.quizLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Too many quiz requests, please slow down',
  },
});
```

---

## Routes

### `/src/routes/authRoutes.js`

```javascript
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['student', 'teacher', 'admin']),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
```

---

### `/src/routes/studentRoutes.js`

```javascript
const express = require('express');
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { quizLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Quizzes
router.get('/quizzes/available', studentController.getAvailableQuizzes);
router.post('/quizzes/:quizId/start', quizLimiter, studentController.startQuizAttempt);
router.post('/quizzes/attempts/:attemptId/answer', quizLimiter, studentController.submitAnswer);
router.post('/quizzes/attempts/:attemptId/submit', studentController.submitQuiz);
router.post('/quizzes/attempts/:attemptId/tab-switch', studentController.logTabSwitch);

// Grades
router.get('/grades', studentController.getGrades);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:notificationId/read', studentController.markNotificationRead);

module.exports = router;
```

---

### `/src/routes/teacherRoutes.js`

```javascript
const express = require('express');
const teacherController = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication and teacher role
router.use(protect);
router.use(authorize('teacher'));

// Dashboard
router.get('/dashboard', teacherController.getDashboard);

// Quizzes
router.post('/quizzes', teacherController.createQuiz);
router.put('/quizzes/:quizId', teacherController.updateQuiz);
router.delete('/quizzes/:quizId', teacherController.deleteQuiz);
router.put('/quizzes/:quizId/publish', teacherController.publishQuiz);
router.get('/quizzes/:quizId/results', teacherController.getQuizResults);
router.get('/quizzes/flagged-attempts', teacherController.getFlaggedAttempts);

// Grades
router.get('/grades/subject/:courseId', teacherController.getGradesBySubject);
router.get('/grades/all', teacherController.getAllGrades);

// Assignments
router.post('/assignments', teacherController.createAssignment);
router.put('/assignments/:assignmentId/submissions/:studentId/grade', teacherController.gradeAssignment);

// Study Materials
router.post('/courses/:courseId/materials', teacherController.uploadStudyMaterial);

// Notifications
router.post('/notifications/send', teacherController.sendNotification);

// Analytics
router.get('/analytics/student/:studentId', teacherController.getStudentAnalytics);

module.exports = router;
```

---

### `/src/routes/adminRoutes.js`

```javascript
const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management
router.post('/users', adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Course Management
router.post('/courses', adminController.createCourse);
router.get('/courses', adminController.getAllCourses);
router.put('/courses/:courseId', adminController.updateCourse);
router.delete('/courses/:courseId', adminController.deleteCourse);
router.put('/courses/:courseId/assign-teacher', adminController.assignTeacher);
router.post('/courses/:courseId/enroll', adminController.enrollStudent);

// Level Management
router.get('/level-promotions', adminController.getLevelPromotions);
router.put('/students/:studentId/level', adminController.overrideStudentLevel);

// Analytics
router.get('/analytics', adminController.getSystemAnalytics);

// Anti-Cheat
router.get('/anti-cheat/reports', adminController.getAntiCheatReports);

// Reports
router.post('/reports/generate', adminController.generateReport);

module.exports = router;
```

---

### `/src/routes/quizRoutes.js`

```javascript
const express = require('express');
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Common quiz routes
router.get('/:quizId', quizController.getQuiz);
router.get('/:quizId/analytics', quizController.getQuizAnalytics);

module.exports = router;
```

---

### `/src/routes/gradeRoutes.js`

```javascript
const express = require('express');
const gradeController = require('../controllers/gradeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Common grade routes
router.get('/course/:courseId', gradeController.getCourseGrades);
router.get('/student/:studentId', gradeController.getStudentGrades);

module.exports = router;
```

---

### `/src/routes/notificationRoutes.js`

```javascript
const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
```

---

### `/src/routes/courseRoutes.js`

```javascript
const express = require('express');
const courseController = require('../controllers/courseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', courseController.getAllCourses);
router.get('/:courseId', courseController.getCourse);
router.get('/:courseId/materials', courseController.getCourseMaterials);
router.get('/:courseId/students', courseController.getCourseStudents);

module.exports = router;
```

---

## Teacher Controller Sample

### `/src/controllers/teacherController.js`

```javascript
const Teacher = require('../models/Teacher');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// Get Teacher Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id })
      .populate('assignedCourses.courseId', 'courseCode courseName');

    const courseIds = teacher.assignedCourses.map(ac => ac.courseId._id);

    // Get active quizzes
    const activeQuizzes = await Quiz.find({
      teacherId: teacher._id,
      status: 'published',
    }).populate('courseId', 'courseCode courseName');

    // Get quiz attempts count
    const totalAttempts = await QuizAttempt.countDocuments({
      courseId: { $in: courseIds },
    });

    // Count students across all courses
    const students = await Student.find({
      'enrolledCourses.courseId': { $in: courseIds },
    });

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          teacherId: teacher.teacherId,
          department: teacher.department,
        },
        assignedCourses: teacher.assignedCourses,
        activeQuizzes,
        totalStudents: students.length,
        totalAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message,
    });
  }
};

// Create Quiz
exports.createQuiz = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    
    const quizData = {
      ...req.body,
      teacherId: teacher._id,
    };

    const quiz = await Quiz.create(quizData);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message,
    });
  }
};

// Publish Quiz
exports.publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { status: 'published' },
      { new: true }
    ).populate('courseId', 'courseCode courseName');

    // Get enrolled students
    const students = await Student.find({
      'enrolledCourses.courseId': quiz.courseId._id,
    }).populate('userId');

    // Send notifications to all enrolled students
    const notifications = students.map(student => ({
      recipientId: student.userId._id,
      recipientRole: 'student',
      senderId: req.user.id,
      type: 'quiz',
      priority: 'high',
      title: 'New Quiz Published',
      message: `A new quiz "${quiz.title}" has been published for ${quiz.courseId.courseName}`,
      actionRequired: true,
      actionUrl: `/student/quizzes/${quiz._id}`,
      relatedEntity: {
        entityType: 'quiz',
        entityId: quiz._id,
      },
    }));

    await Notification.insertMany(notifications);

    // Emit real-time notifications
    const io = req.app.get('io');
    students.forEach(student => {
      io.to(student.userId._id.toString()).emit('quiz:published', {
        quizId: quiz._id,
        title: quiz.title,
        courseCode: quiz.courseId.courseCode,
      });
    });

    res.status(200).json({
      success: true,
      message: 'Quiz published successfully',
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to publish quiz',
      error: error.message,
    });
  }
};

// Get Quiz Results
exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    const attempts = await QuizAttempt.find({
      quizId,
      status: { $in: ['submitted', 'auto-submitted'] },
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .sort({ percentage: -1 });

    // Calculate statistics
    const scores = attempts.map(a => a.score);
    const percentages = attempts.map(a => a.percentage);
    
    const statistics = {
      totalAttempts: attempts.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length || 0,
      highestScore: Math.max(...scores, 0),
      lowestScore: Math.min(...scores, quiz.totalMarks),
      passRate: (attempts.filter(a => a.percentage >= 50).length / attempts.length * 100) || 0,
    };

    const results = attempts.map(attempt => ({
      studentId: attempt.studentId.studentId,
      studentName: `${attempt.studentId.userId.firstName} ${attempt.studentId.userId.lastName}`,
      score: attempt.score,
      percentage: attempt.percentage,
      submittedAt: attempt.submittedAt,
      antiCheatFlags: {
        isFlagged: attempt.antiCheatLog.isFlagged,
        tabSwitches: attempt.antiCheatLog.tabSwitches,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          title: quiz.title,
          totalMarks: quiz.totalMarks,
        },
        results,
        statistics,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: error.message,
    });
  }
};

// Get Grades by Subject
exports.getGradesBySubject = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    const grades = await Grade.find({ courseId })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .sort({ 'overallGrade.percentage': -1 });

    const students = grades.map(grade => ({
      studentId: grade.studentId.studentId,
      studentName: `${grade.studentId.userId.firstName} ${grade.studentId.userId.lastName}`,
      level: grade.studentId.level,
      assessments: grade.assessments,
      overallPercentage: grade.overallGrade.percentage,
      letterGrade: grade.overallGrade.letterGrade,
      gpa: grade.overallGrade.gpa,
    }));

    res.status(200).json({
      success: true,
      data: {
        course: {
          courseCode: course.courseCode,
          courseName: course.courseName,
        },
        students,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      error: error.message,
    });
  }
};

// Get All Grades (Cross-Subject)
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('courseId', 'courseCode courseName')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .sort({ 'studentId.studentId': 1, 'courseId.courseCode': 1 });

    res.status(200).json({
      success: true,
      data: {
        grades,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all grades',
      error: error.message,
    });
  }
};

// Send Notification
exports.sendNotification = async (req, res) => {
  try {
    const { courseId, type, priority, title, message, actionRequired } = req.body;

    // Get enrolled students
    const students = await Student.find({
      'enrolledCourses.courseId': courseId,
    }).populate('userId');

    const notifications = students.map(student => ({
      recipientId: student.userId._id,
      recipientRole: 'student',
      senderId: req.user.id,
      type,
      priority,
      title,
      message,
      actionRequired,
    }));

    await Notification.insertMany(notifications);

    // Emit real-time notifications
    const io = req.app.get('io');
    students.forEach(student => {
      io.to(student.userId._id.toString()).emit('notification:new', {
        type,
        title,
        message,
        priority,
      });
    });

    res.status(200).json({
      success: true,
      message: `Notification sent to ${students.length} students`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
};

// Additional methods: updateQuiz, deleteQuiz, createAssignment, gradeAssignment, etc.
// Follow similar patterns as above
```

---

This provides a comprehensive backend structure. For deployment, use:

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start
```

Connect your frontend by updating API base URL to point to your backend server (e.g., `http://localhost:5000/api`).

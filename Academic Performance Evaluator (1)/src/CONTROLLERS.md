# Controller Implementations

## Authentication Controller

### `/src/controllers/authController.js`

```javascript
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    // Create role-specific profile
    if (role === 'student') {
      await Student.create({
        userId: user._id,
        studentId: additionalData.studentId,
        department: additionalData.department,
        semester: additionalData.semester,
      });
    } else if (role === 'teacher') {
      await Teacher.create({
        userId: user._id,
        teacherId: additionalData.teacherId,
        department: additionalData.department,
        specialization: additionalData.specialization,
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id })
        .populate('enrolledCourses.courseId', 'courseCode courseName');
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ userId: user._id })
        .populate('assignedCourses.courseId', 'courseCode courseName');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
```

---

## Student Controller

### `/src/controllers/studentController.js`

```javascript
const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { checkAndPromoteStudent } = require('../utils/promotionEngine');

// Get Student Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('enrolledCourses.courseId', 'courseCode courseName credits teacherId');

    // Get upcoming quizzes
    const now = new Date();
    const enrolledCourseIds = student.enrolledCourses.map(ec => ec.courseId._id);
    
    const upcomingQuizzes = await Quiz.find({
      courseId: { $in: enrolledCourseIds },
      status: 'published',
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate('courseId', 'courseCode courseName')
      .sort({ startTime: 1 })
      .limit(5);

    // Get recent grades
    const recentGrades = await Grade.find({ studentId: student._id })
      .populate('courseId', 'courseCode courseName')
      .sort({ 'assessments.gradedAt': -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          level: student.level,
          performanceMetrics: student.performanceMetrics,
        },
        enrolledCourses: student.enrolledCourses,
        upcomingQuizzes,
        recentGrades,
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

// Get Available Quizzes
exports.getAvailableQuizzes = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const enrolledCourseIds = student.enrolledCourses.map(ec => ec.courseId);

    const now = new Date();
    const quizzes = await Quiz.find({
      courseId: { $in: enrolledCourseIds },
      status: 'published',
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate('courseId', 'courseCode courseName')
      .select('-questions.correctAnswer'); // Don't send correct answers

    // Check if student has attempted each quiz
    const quizzesWithAttemptStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempt = await QuizAttempt.findOne({
          quizId: quiz._id,
          studentId: student._id,
          status: { $in: ['submitted', 'auto-submitted'] },
        });

        return {
          ...quiz.toObject(),
          isAttempted: !!attempt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        quizzes: quizzesWithAttemptStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: error.message,
    });
  }
};

// Start Quiz Attempt
exports.startQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const student = await Student.findOne({ userId: req.user.id });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check if quiz is available
    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Quiz is not available at this time',
      });
    }

    // Check if already attempted
    const existingAttempt = await QuizAttempt.findOne({
      quizId,
      studentId: student._id,
      status: { $in: ['submitted', 'auto-submitted'] },
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this quiz',
      });
    }

    // Randomize questions if enabled
    let questions = quiz.questions;
    if (quiz.antiCheatSettings.randomizeQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Create attempt
    const attempt = await QuizAttempt.create({
      quizId,
      studentId: student._id,
      courseId: quiz.courseId,
      startedAt: now,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Remove correct answers from questions
    const questionsWithoutAnswers = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      marks: q.marks,
    }));

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          duration: quiz.duration,
          totalMarks: quiz.totalMarks,
          questions: questionsWithoutAnswers,
          antiCheatSettings: quiz.antiCheatSettings,
        },
        startedAt: attempt.startedAt,
        endsAt: new Date(attempt.startedAt.getTime() + quiz.duration * 60000),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: error.message,
    });
  }
};

// Submit Answer
exports.submitAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt || attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt',
      });
    }

    // Find existing answer or add new
    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex > -1) {
      attempt.answers[existingAnswerIndex].answer = answer;
      attempt.answers[existingAnswerIndex].timeSpent = timeSpent;
    } else {
      attempt.answers.push({
        questionId,
        answer,
        timeSpent,
      });
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save answer',
      error: error.message,
    });
  }
};

// Submit Quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId);
    const quiz = await Quiz.findById(attempt.quizId);
    const student = await Student.findById(attempt.studentId);

    // Grade the quiz
    let totalScore = 0;
    attempt.answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (!question) return;

      let isCorrect = false;
      if (question.questionType === 'mcq' || question.questionType === 'true-false') {
        isCorrect = answer.answer === question.correctAnswer;
      } else if (question.questionType === 'multiple') {
        isCorrect = JSON.stringify(answer.answer.sort()) === 
                   JSON.stringify(question.correctAnswer.sort());
      }

      answer.isCorrect = isCorrect;
      answer.marksAwarded = isCorrect ? question.marks : 0;
      totalScore += answer.marksAwarded;
    });

    attempt.score = totalScore;
    attempt.percentage = (totalScore / quiz.totalMarks) * 100;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();

    // Check for anti-cheat flags
    if (attempt.antiCheatLog.tabSwitches > quiz.antiCheatSettings.maxTabSwitches) {
      attempt.antiCheatLog.isFlagged = true;
    }

    await attempt.save();

    // Update student performance metrics
    student.performanceMetrics.totalQuizzesTaken += 1;
    const allAttempts = await QuizAttempt.find({
      studentId: student._id,
      status: { $in: ['submitted', 'auto-submitted'] },
    });

    const totalPercentage = allAttempts.reduce((sum, a) => sum + a.percentage, 0);
    student.performanceMetrics.averageScore = totalPercentage / allAttempts.length;

    // Check consecutive high scores
    if (attempt.percentage >= 80) {
      student.performanceMetrics.consecutiveHighScores += 1;
    } else {
      student.performanceMetrics.consecutiveHighScores = 0;
    }

    await student.save();

    // Check for level promotion
    const promotion = await checkAndPromoteStudent(student);

    // Update grades
    await Grade.findOneAndUpdate(
      { studentId: student._id, courseId: quiz.courseId },
      {
        $push: {
          assessments: {
            assessmentId: quiz._id,
            assessmentType: 'quiz',
            marksObtained: totalScore,
            totalMarks: quiz.totalMarks,
            percentage: attempt.percentage,
            submittedAt: attempt.submittedAt,
            gradedAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Send notification
    const io = req.app.get('io');
    const notification = await Notification.create({
      recipientId: student.userId,
      type: 'grade',
      priority: 'medium',
      title: 'Quiz Graded',
      message: `Your quiz "${quiz.title}" has been graded. Score: ${totalScore}/${quiz.totalMarks}`,
      actionUrl: `/student/grades`,
    });

    io.to(student.userId.toString()).emit('notification:new', notification);
    if (promotion) {
      io.to(student.userId.toString()).emit('level:promoted', promotion);
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        score: totalScore,
        totalMarks: quiz.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.percentage >= (quiz.passingMarks / quiz.totalMarks) * 100,
        levelPromotion: promotion,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message,
    });
  }
};

// Log Tab Switch
exports.logTabSwitch = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    attempt.antiCheatLog.tabSwitches += 1;
    attempt.antiCheatLog.tabSwitchTimestamps.push(new Date());
    
    const quiz = await Quiz.findById(attempt.quizId);
    if (attempt.antiCheatLog.tabSwitches > quiz.antiCheatSettings.maxTabSwitches) {
      attempt.antiCheatLog.isFlagged = true;
    }

    await attempt.save();

    res.status(200).json({
      success: true,
      data: {
        tabSwitches: attempt.antiCheatLog.tabSwitches,
        maxAllowed: quiz.antiCheatSettings.maxTabSwitches,
        isFlagged: attempt.antiCheatLog.isFlagged,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to log tab switch',
      error: error.message,
    });
  }
};

// Get Grades
exports.getGrades = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    const { courseId, semester } = req.query;

    const filter = { studentId: student._id };
    if (courseId) filter.courseId = courseId;
    if (semester) filter.semester = semester;

    const grades = await Grade.find(filter)
      .populate('courseId', 'courseCode courseName credits');

    res.status(200).json({
      success: true,
      data: {
        grades,
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

// Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly, priority } = req.query;

    const filter = { recipientId: req.user.id };
    if (unreadOnly === 'true') filter.isRead = false;
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
};

// Mark Notification as Read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message,
    });
  }
};
```

---

## Promotion Engine Utility

### `/src/utils/promotionEngine.js`

```javascript
const Student = require('../models/Student');
const LevelPromotion = require('../models/LevelPromotion');
const Notification = require('../models/Notification');

// Level promotion thresholds
const PROMOTION_THRESHOLDS = {
  'Beginner': {
    next: 'Intermediate',
    requiredAvgScore: 75,
    requiredConsecutiveHighScores: 3,
    minQuizzesTaken: 5,
  },
  'Intermediate': {
    next: 'Advanced',
    requiredAvgScore: 85,
    requiredConsecutiveHighScores: 5,
    minQuizzesTaken: 10,
  },
};

exports.checkAndPromoteStudent = async (student) => {
  const currentLevel = student.level;
  const threshold = PROMOTION_THRESHOLDS[currentLevel];

  if (!threshold) {
    return null; // Already at highest level
  }

  const metrics = student.performanceMetrics;

  // Check if student meets promotion criteria
  const meetsAvgScore = metrics.averageScore >= threshold.requiredAvgScore;
  const meetsConsecutive = metrics.consecutiveHighScores >= threshold.requiredConsecutiveHighScores;
  const meetsMinQuizzes = metrics.totalQuizzesTaken >= threshold.minQuizzesTaken;

  if (meetsAvgScore && meetsConsecutive && meetsMinQuizzes) {
    const previousLevel = student.level;
    student.level = threshold.next;
    student.performanceMetrics.lastLevelUpdate = new Date();
    student.performanceMetrics.consecutiveHighScores = 0; // Reset
    await student.save();

    // Log promotion
    await LevelPromotion.create({
      studentId: student._id,
      previousLevel,
      newLevel: threshold.next,
      promotedAt: new Date(),
      reason: 'Automatic promotion based on performance',
      triggerMetrics: {
        consecutiveHighScores: metrics.consecutiveHighScores,
        averageScore: metrics.averageScore,
        totalQuizzesTaken: metrics.totalQuizzesTaken,
      },
      isAutomatic: true,
    });

    // Send notification
    await Notification.create({
      recipientId: student.userId,
      type: 'system',
      priority: 'high',
      title: 'Level Promotion!',
      message: `Congratulations! You've been promoted to ${threshold.next} level based on your excellent performance.`,
      actionRequired: false,
    });

    return {
      promoted: true,
      newLevel: threshold.next,
      previousLevel,
    };
  }

  return null;
};
```

---

For Teacher and Admin controller implementations, middleware, routes, and complete setup instructions, refer to the additional documentation or let me know if you need those sections expanded!

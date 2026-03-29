const Quiz       = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');

// Teacher: Create quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, courseId, createdBy, questions, timeLimit, dueDate } = req.body;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const quiz = await Quiz.create({ title, courseId, createdBy, questions, timeLimit, totalMarks, dueDate });
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Error creating quiz', error: err.message });
  }
};

// Teacher: Publish quiz
exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz published', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing quiz', error: err.message });
  }
};

// Get all quizzes for a course
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quizzes', error: err.message });
  }
};

// Get single quiz — hides correct answers for students
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const safeQuiz = {
      _id:        quiz._id,
      title:      quiz.title,
      courseId:   quiz.courseId,
      timeLimit:  quiz.timeLimit,
      totalMarks: quiz.totalMarks,
      isPublished:quiz.isPublished,
      dueDate:    quiz.dueDate,
      questions:  quiz.questions.map(q => ({
        _id:          q._id,
        questionText: q.questionText,
        type:         q.type,
        options:      q.options,
        marks:        q.marks
        // correctAnswer intentionally hidden
      }))
    };
    res.json(safeQuiz);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quiz', error: err.message });
  }
};

// Student: Submit and auto-grade
exports.submitQuiz = async (req, res) => {
  try {
    const { studentId, answers, timeTaken, courseId } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const existing = await QuizResult.findOne({ studentId, quizId: quiz._id });
    if (existing) return res.status(400).json({ message: 'Quiz already attempted' });

    let score = 0;
    const gradedAnswers = answers.map(ans => {
      const question = quiz.questions.id(ans.questionId);
      if (!question) return { ...ans, isCorrect: false, marksAwarded: 0 };
      const isCorrect = question.correctAnswer.trim().toLowerCase() ===
                        ans.selectedAnswer.trim().toLowerCase();
      const marksAwarded = isCorrect ? question.marks : 0;
      score += marksAwarded;
      return { ...ans, isCorrect, marksAwarded };
    });

    const percentage = quiz.totalMarks > 0
      ? Math.round((score / quiz.totalMarks) * 10000) / 100
      : 0;

    const result = await QuizResult.create({
      studentId, quizId: quiz._id, courseId,
      answers: gradedAnswers, score,
      totalMarks: quiz.totalMarks, percentage, timeTaken
    });

    res.status(201).json({
      message: 'Quiz submitted successfully',
      score, totalMarks: quiz.totalMarks, percentage,
      gradedAnswers,
      correctAnswers: quiz.questions.map(q => ({
        questionId:    q._id,
        correctAnswer: q.correctAnswer
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting quiz', error: err.message });
  }
};

// Teacher: All attempts for a quiz
exports.getQuizAttempts = async (req, res) => {
  try {
    const results = await QuizResult.find({ quizId: req.params.id })
      .populate('studentId', 'name email studentId department semester');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attempts', error: err.message });
  }
};

// Student: Their own result
exports.getStudentResult = async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      quizId:    req.params.quizId,
      studentId: req.params.studentId
    }).populate('quizId');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching result', error: err.message });
  }
};
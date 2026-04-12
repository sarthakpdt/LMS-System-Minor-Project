const Quiz        = require('../models/Quiz');
const QuizResult  = require('../models/QuizResult');
const { checkAndPromote } = require('./bucketController');

// ── Teacher: Create quiz ──────────────────────────────────────────────────────
exports.createQuiz = async (req, res) => {
  try {
    const {
      title, courseId, createdBy, questions,
      timeLimit, dueDate, difficulty, negativeMarking
    } = req.body;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const quiz = await Quiz.create({
      title, courseId, createdBy, questions, timeLimit, totalMarks, dueDate,
      difficulty: difficulty || null,
      negativeMarking: {
        enabled: negativeMarking?.enabled || false,
        marksPerQuestion: negativeMarking?.marksPerQuestion || 0,
      },
    });
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Error creating quiz', error: err.message });
  }
};

// ── Teacher: Publish quiz ─────────────────────────────────────────────────────
exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz published', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing quiz', error: err.message });
  }
};

// ── Get all quizzes for a course — optionally filtered by bucket ──────────────
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const filter = { courseId: req.params.courseId };
    const { bucket } = req.query;
    if (bucket && ['Easy', 'Medium', 'Hard'].includes(bucket)) {
      filter.$or = [
        { difficulty: bucket },
        { difficulty: null },
        { difficulty: { $exists: false } },
      ];
    }
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quizzes', error: err.message });
  }
};

// ── Get single quiz — hides correct answers for students ──────────────────────
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const safeQuiz = {
      _id: quiz._id, title: quiz.title, courseId: quiz.courseId,
      timeLimit: quiz.timeLimit, totalMarks: quiz.totalMarks,
      isPublished: quiz.isPublished, dueDate: quiz.dueDate,
      difficulty: quiz.difficulty,
      negativeMarking: quiz.negativeMarking,
      questions: quiz.questions.map(q => ({
        _id: q._id, questionText: q.questionText,
        type: q.type, options: q.options, marks: q.marks,
        level: q.level,
      }))
    };
    res.json(safeQuiz);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching quiz', error: err.message });
  }
};

// ── Student: Submit, auto-grade, apply negative marking, then auto-promote ────
exports.submitQuiz = async (req, res) => {
  try {
    const { studentId, answers, timeTaken, courseId } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const existing = await QuizResult.findOne({ studentId, quizId: quiz._id });
    if (existing) return res.status(400).json({ message: 'Quiz already attempted' });

    const negEnabled = quiz.negativeMarking?.enabled || false;
    const negMarks   = quiz.negativeMarking?.marksPerQuestion || 0;

    let score = 0;
    const gradedAnswers = answers.map(ans => {
      const question = quiz.questions.id(ans.questionId);
      if (!question) return { ...ans, isCorrect: false, marksAwarded: 0 };
      const isCorrect = question.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase();
      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks;
      } else if (negEnabled && negMarks > 0 && ans.selectedAnswer.trim() !== '') {
        // Only apply negative marks if student actually attempted the question
        marksAwarded = -negMarks;
      }
      score += marksAwarded;
      return { ...ans, isCorrect, marksAwarded };
    });

    // Floor score at 0
    score = Math.max(0, score);

    const percentage = quiz.totalMarks > 0 ? Math.round((score / quiz.totalMarks) * 10000) / 100 : 0;

    await QuizResult.create({
      studentId, quizId: quiz._id, courseId,
      answers: gradedAnswers, score,
      totalMarks: quiz.totalMarks, percentage, timeTaken,
    });

    // Auto-promotion check after submit
    const promotion = await checkAndPromote(studentId, courseId || quiz.courseId, quiz._id);

    res.status(201).json({
      message: 'Quiz submitted successfully',
      score, totalMarks: quiz.totalMarks, percentage,
      gradedAnswers,
      correctAnswers: quiz.questions.map(q => ({ questionId: q._id, correctAnswer: q.correctAnswer })),
      promotion,
      negativeMarkingApplied: negEnabled,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting quiz', error: err.message });
  }
};

// ── Teacher: All attempts for a quiz ─────────────────────────────────────────
exports.getQuizAttempts = async (req, res) => {
  try {
    const results = await QuizResult.find({ quizId: req.params.id })
      .populate('studentId', 'name email studentId department semester');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attempts', error: err.message });
  }
};

// ── Student: Their own result ─────────────────────────────────────────────────
exports.getStudentResult = async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      quizId: req.params.quizId, studentId: req.params.studentId
    }).populate('quizId');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching result', error: err.message });
  }
};

// ── NEW: Generate AI questions via Gemini API ─────────────────────────────────
exports.generateAIQuestions = async (req, res) => {
  try {
    const { topic, questionsPerLevel = 5, subject = '' } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' });
    }

    const subjectHint = subject ? ` in the subject "${subject}"` : '';
    const prompt = `You are a quiz creator for a Learning Management System. Generate exactly ${questionsPerLevel} MCQ questions for each of the 3 difficulty levels (Beginner, Medium, Hard) on the topic "${topic}"${subjectHint}.

IMPORTANT: Return ONLY a valid JSON array. No explanation, no markdown, no code blocks. Just the raw JSON array starting with [ and ending with ].

Each question object must have exactly these fields:
- "questionText": string (the question)
- "type": "mcq"
- "options": array of exactly 4 strings
- "correctAnswer": string (must exactly match one of the options)
- "marks": number (Beginner=1, Medium=2, Hard=3)
- "level": "Beginner" | "Medium" | "Hard"

Generate ${questionsPerLevel} Beginner, ${questionsPerLevel} Medium, ${questionsPerLevel} Hard questions. Total: ${questionsPerLevel * 3} in one JSON array.`;

    // v1beta supports all current Gemini models on free tier
    const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
    const models = [
      'gemini-2.0-flash-lite-001',  // stable, supports generateContent
      'gemini-2.0-flash-001',       // stable, supports generateContent
      'gemini-2.0-flash',           // supports generateContent
      'gemini-2.5-flash-lite',      // stable, supports generateContent
      'gemini-flash-lite-latest',   // latest lite
    ];

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    let geminiData = null;
    let lastError = '';

    for (const model of models) {
      try {
        const url = `${BASE}/${model}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        });

        if (resp.status === 429) {
          console.warn(`[AI Quiz] ${model} rate-limited (429), waiting 8s...`);
          await sleep(8000);
          // retry once
          const retry = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
            }),
          });
          if (retry.ok) {
            console.log(`[AI Quiz] Using model (retry): ${model}`);
            geminiData = await retry.json();
            break;
          } else {
            lastError = await retry.text();
            console.warn(`[AI Quiz] ${model} retry also failed: ${lastError.slice(0, 150)}`);
            continue;
          }
        }

        if (!resp.ok) {
          lastError = await resp.text();
          console.warn(`[AI Quiz] ${model} failed (${resp.status}): ${lastError.slice(0, 150)}`);
          continue;
        }

        console.log(`[AI Quiz] Using model: ${model}`);
        geminiData = await resp.json();
        break;

      } catch (fetchErr) {
        lastError = fetchErr.message;
        console.warn(`[AI Quiz] Fetch error for ${model}: ${fetchErr.message}`);
      }
    }

    if (!geminiData) {
      return res.status(502).json({
        message: 'All Gemini models failed. Check your API key quota at aistudio.google.com.',
        detail: lastError.slice(0, 500),
      });
    }

    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      const blockReason = geminiData?.promptFeedback?.blockReason;
      return res.status(502).json({
        message: blockReason ? `Gemini blocked: ${blockReason}` : 'Gemini returned empty response',
        raw: JSON.stringify(geminiData).slice(0, 500),
      });
    }

    rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (arrayMatch) rawText = arrayMatch[0];

    let questions;
    try {
      questions = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ message: 'Could not parse Gemini response. Try again.', raw: rawText.slice(0, 500) });
    }

    if (!Array.isArray(questions)) {
      return res.status(502).json({ message: 'Gemini did not return a JSON array.' });
    }

    const sanitised = questions.map(q => ({
      questionText: q.questionText || q.question || '',
      type: 'mcq',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: q.correctAnswer || q.answer || q.options?.[0] || '',
      marks: typeof q.marks === 'number' ? q.marks : (q.level === 'Hard' ? 3 : q.level === 'Medium' ? 2 : 1),
      level: ['Beginner', 'Medium', 'Hard'].includes(q.level) ? q.level : 'Beginner',
    })).filter(q => q.questionText.trim() !== '');

    console.log(`[AI Quiz] Generated ${sanitised.length} questions for: "${topic}"`);
    res.json({ questions: sanitised, count: sanitised.length });

  } catch (err) {
    console.error('[AI Quiz] Unexpected error:', err);
    res.status(500).json({ message: 'Error generating questions', error: err.message });
  }
};

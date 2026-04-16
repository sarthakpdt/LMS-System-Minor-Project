const Quiz        = require('../models/Quiz');
const QuizResult  = require('../models/QuizResult');
const { checkAndPromote } = require('./bucketController');

// ── In-memory question cache for FEATURE 3 (fast generation) ──────────────────
// Cache key: "topic|subject|level" → array of questions
// Entries expire after 1 hour to keep content fresh
const QUESTION_CACHE = new Map();
const CACHE_TTL_MS   = 60 * 60 * 1000; // 1 hour

function getCacheKey(topic, subject, level) {
  return `${topic.toLowerCase().trim()}|${subject.toLowerCase().trim()}|${level}`;
}

function setCached(topic, subject, level, questions) {
  QUESTION_CACHE.set(getCacheKey(topic, subject, level), {
    questions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function getCached(topic, subject, level) {
  const entry = QUESTION_CACHE.get(getCacheKey(topic, subject, level));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { QUESTION_CACHE.delete(getCacheKey(topic, subject, level)); return null; }
  return entry.questions;
}

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
// FEATURE 4: Publishing already works by bucket — the quiz has a `difficulty`
// field. getQuizzesByCourse filters by student bucket, so only matching
// students see the quiz. Publish just flips isPublished = true.
exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz published', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Error publishing quiz', error: err.message });
  }
};

// ── Get all quizzes for a course — filtered by student bucket ─────────────────
// FEATURE 4: When a student's bucket is passed, only quizzes matching that
// bucket (or with no bucket) are returned. This enforces bucket-based delivery.
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
        marksAwarded = -negMarks;
      }
      score += marksAwarded;
      return { ...ans, isCorrect, marksAwarded };
    });

    score = Math.max(0, score);
    const percentage = quiz.totalMarks > 0 ? Math.round((score / quiz.totalMarks) * 10000) / 100 : 0;

    await QuizResult.create({
      studentId, quizId: quiz._id, courseId,
      answers: gradedAnswers, score,
      totalMarks: quiz.totalMarks, percentage, timeTaken,
    });

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

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: Fast AI Question Generation via Gemini
// Optimisations applied:
//   1. Per-level caching — avoids re-generating the same topic/level combo
//   2. Parallel async calls — generates all requested levels simultaneously
//      instead of sequentially, cutting wait time by ~2/3 for 3 levels
//   3. Minimal concise prompts — shorter prompts → faster model response
//   4. Smaller per-request — requests each level independently so failures
//      don't block the others
//   5. Model priority — fastest lite model tried first
// ─────────────────────────────────────────────────────────────────────────────
exports.generateAIQuestions = async (req, res) => {
  try {
    const { topic, questionsPerLevel = 5, subject = '', levels } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ message: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' });
    }

    // Determine which levels to generate (FEATURE 2: only selected buckets)
    const VALID_LEVELS = ['Beginner', 'Medium', 'Hard'];
    const levelsToGenerate = Array.isArray(levels) && levels.length > 0
      ? levels.filter(l => VALID_LEVELS.includes(l))
      : VALID_LEVELS;

    const BASE    = 'https://generativelanguage.googleapis.com/v1beta/models';
    // FEATURE 3: Fastest models first — lite models have ~1s median response
    const MODELS  = [
      'gemini-2.0-flash-lite-001',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite',
    ];
    const subjectHint = subject ? ` in "${subject}"` : '';

    // ── FEATURE 3: Generate a single level's questions with caching ────────
    const generateLevel = async (level) => {
      // 1. Check cache first — instant return if hit
      const cached = getCached(topic, subject, level);
      if (cached) {
        console.log(`[AI Quiz] Cache HIT for "${topic}" / ${level}`);
        return cached.slice(0, questionsPerLevel);
      }

      // 2. Build a concise prompt — smaller prompt = faster response
      const marksMap = { Beginner: 1, Medium: 2, Hard: 3 };
      const marks    = marksMap[level];
      const prompt   = `Generate exactly ${questionsPerLevel} MCQ quiz questions at ${level} difficulty on "${topic}"${subjectHint}.
Return ONLY a JSON array. No markdown, no explanation.
Each object: {"questionText":string,"type":"mcq","options":[4 strings],"correctAnswer":string,"marks":${marks},"level":"${level}"}`;

      // 3. Try each model until one succeeds
      let result = null;
      for (const model of MODELS) {
        try {
          const url  = `${BASE}/${model}:generateContent?key=${apiKey}`;
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // FEATURE 3: Limit tokens to reduce response size → faster
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
            }),
          });

          if (resp.status === 429) {
            // Brief wait only on 429, then move to next model immediately
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          if (!resp.ok) continue;

          const data = await resp.json();
          let raw    = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!raw) continue;

          raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const match = raw.match(/\[[\s\S]*\]/);
          if (match) raw = match[0];

          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed) || parsed.length === 0) continue;

          console.log(`[AI Quiz] ${level} — model: ${model}, count: ${parsed.length}`);
          result = parsed;
          break;
        } catch { continue; }
      }

      if (!result) return [];

      // Sanitise
      const sanitised = result
        .filter(q => (q.questionText || q.question || '').trim() !== '')
        .map(q => ({
          questionText: q.questionText || q.question || '',
          type: 'mcq',
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer || q.answer || q.options?.[0] || '',
          marks: typeof q.marks === 'number' ? q.marks : marksMap[level],
          level,
        }))
        .slice(0, questionsPerLevel);

      // 4. Cache the result for this topic+subject+level combo
      setCached(topic, subject, level, sanitised);
      return sanitised;
    };

    // ── FEATURE 3: PARALLEL generation for all requested levels ───────────
    // Runs all level requests simultaneously instead of sequentially.
    // 3 levels in parallel ≈ same time as 1 level sequentially.
    console.log(`[AI Quiz] Generating ${levelsToGenerate.join(', ')} in PARALLEL for: "${topic}"`);
    const levelResults = await Promise.allSettled(
      levelsToGenerate.map(level => generateLevel(level))
    );

    // Combine results
    const allQuestions = [];
    levelResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allQuestions.push(...result.value);
      } else {
        console.warn(`[AI Quiz] ${levelsToGenerate[idx]} generation failed:`, result.reason);
      }
    });

    if (allQuestions.length === 0) {
      return res.status(502).json({ message: 'All Gemini models failed for all levels. Check your API key quota at aistudio.google.com.' });
    }

    console.log(`[AI Quiz] Total generated: ${allQuestions.length} questions for "${topic}"`);
    res.json({ questions: allQuestions, count: allQuestions.length });

  } catch (err) {
    console.error('[AI Quiz] Unexpected error:', err);
    res.status(500).json({ message: 'Error generating questions', error: err.message });
  }
};

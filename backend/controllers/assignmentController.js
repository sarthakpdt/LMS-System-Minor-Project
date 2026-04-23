const Assignment           = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const fs                   = require('fs');
const path                 = require('path');

// ── Gemini AI helper ──────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;

  const MODELS = [
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  for (const model of MODELS) {
    try {
      const url  = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      });
      if (resp.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue; }
      if (!resp.ok) continue;
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) { console.log(`[AI] model: ${model}`); return text; }
    } catch (e) { console.warn(`[AI] ${model} failed:`, e.message); }
  }
  return null;
}

function parseJSON(raw) {
  let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) return JSON.parse(arr[0]);
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) return JSON.parse(obj[0]);
  return JSON.parse(text);
}

function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function sanitiseQuestions(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map(q => ({
      questionText:  String(q.questionText || '').trim(),
      type:          ['mcq','short','long'].includes(q.type) ? q.type : 'short',
      options:       Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      correctAnswer: String(q.correctAnswer || ''),
      marks:         typeof q.marks === 'number' ? q.marks :
                     (q.difficulty === 'hard' ? 15 : q.difficulty === 'medium' ? 10 : 5),
      difficulty:    ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      source:        q.source || 'ai',
    }))
    .filter(q => q.questionText !== '');
}

// ── POST /api/assignments/gemini ──────────────────────────────
exports.geminiProxy = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'prompt required' });
    const response = await callGemini(prompt);
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/ai-performance ─────────────────────
exports.aiPerformance = async (req, res) => {
  try {
    const { quizResults = [], assignmentResults = [], studentName = 'Student' } = req.body;

    if (quizResults.length === 0 && assignmentResults.length === 0) {
      return res.json({
        success: true,
        feedback: {
          summary: 'No assessment data yet. Complete quizzes and assignments to see your analysis.',
          strengths: [], areasOfImprovement: [], weakAreas: [],
          suggestedTopics: [], improvementTips: [],
          overallStatus: 'On Track',
          priorityAction: 'Start by completing your first quiz or assignment!'
        }
      });
    }

    const allScores = [
      ...quizResults.map(r => ({
        subject: r.subject || r.quizTitle || 'Quiz',
        pct: r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0
      })),
      ...assignmentResults.map(r => ({
        subject: r.subject || r.title || 'Assignment',
        pct: r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0
      })),
    ];

    const prompt = `You are an academic AI coach. Analyze ${studentName}'s performance:

Quiz Results: ${JSON.stringify(quizResults)}
Assignment Results: ${JSON.stringify(assignmentResults)}

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence overall summary",
  "strengths": ["strength 1", "strength 2"],
  "areasOfImprovement": ["area 1", "area 2"],
  "weakAreas": [{"subject":"Math","percentage":45,"status":"Weak Area"}],
  "suggestedTopics": ["topic 1"],
  "improvementTips": ["tip 1", "tip 2"],
  "overallStatus": "On Track",
  "priorityAction": "Focus on X this week"
}
overallStatus must be exactly one of: "Needs Attention", "On Track", "Excellent"`;

    const text   = await callGemini(prompt);
    let feedback = null;

    if (text) {
      try { feedback = parseJSON(text); } catch {}
    }

    if (!feedback) {
      const avgPct = allScores.length > 0
        ? Math.round(allScores.reduce((s, a) => s + a.pct, 0) / allScores.length) : 0;
      feedback = {
        summary: `${studentName} has completed ${allScores.length} assessments with an average of ${avgPct}%.`,
        strengths: allScores.filter(s => s.pct >= 75).map(s => `${s.subject} — ${s.pct}%`),
        areasOfImprovement: allScores.filter(s => s.pct < 75).map(s => `${s.subject} — ${s.pct}%`),
        weakAreas: allScores.filter(s => s.pct < 75).map(s => ({
          subject: s.subject, percentage: s.pct,
          status: s.pct < 50 ? 'Weak Area' : 'Needs Improvement'
        })),
        suggestedTopics: [],
        improvementTips: ['Review incorrect answers.', 'Practice daily.', 'Ask your teacher for help.'],
        overallStatus: avgPct >= 75 ? 'Excellent' : avgPct >= 50 ? 'On Track' : 'Needs Attention',
        priorityAction: 'Keep practicing consistently!',
      };
    }

    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/generate-ai ────────────────────────
exports.generateWithAI = async (req, res) => {
  try {
    const { topic, courseName, easyCount = 2, mediumCount = 3, hardCount = 2 } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'topic required' });

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here')
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not set in .env' });

    const prompt = `Generate assignment questions${courseName ? ` for "${courseName}"` : ''} on "${topic}".
Create exactly: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard questions.
Mix MCQ and short-answer. MCQs must have exactly 4 options.
Return ONLY a valid JSON array. No markdown, no explanation.
Each object: {"questionText":string,"type":"mcq"|"short"|"long","options":[],"correctAnswer":string,"marks":number,"difficulty":"easy"|"medium"|"hard","source":"ai"}
Easy=5 marks, Medium=10 marks, Hard=15 marks.`;

    const raw = await callGemini(prompt);
    if (!raw) return res.status(502).json({ success: false, message: 'Gemini no response. Check API key quota.' });

    let questions;
    try { questions = parseJSON(raw); }
    catch { return res.status(502).json({ success: false, message: 'Could not parse Gemini response.' }); }

    res.json({ success: true, questions: sanitiseQuestions(questions), count: sanitiseQuestions(questions).length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/generate-variations ─────────────────
exports.generateVariations = async (req, res) => {
  try {
    const { baseQuestion, difficulty = 'all', courseName = '' } = req.body;
    const diffs = difficulty === 'all' ? ['easy', 'medium', 'hard'] : [difficulty];

    const prompt = `Generate variations of this base question at different difficulty levels.
Base Question: "${baseQuestion}"
Course: "${courseName}"
Difficulties needed: ${diffs.join(', ')}

Return ONLY valid JSON:
{
  "variations": {
    "easy":   [{"questionText":"...","type":"mcq","difficulty":"easy","options":["A","B","C","D"],"correctAnswer":"A","marks":5}],
    "medium": [{"questionText":"...","type":"short","difficulty":"medium","options":[],"correctAnswer":"key points","marks":10}],
    "hard":   [{"questionText":"...","type":"long","difficulty":"hard","options":[],"correctAnswer":"detailed answer","marks":15}]
  }
}
Generate 2-3 questions per difficulty level. Return empty arrays for unrequested difficulties.`;

    const raw = await callGemini(prompt);
    if (!raw) return res.status(502).json({ success: false, message: 'Gemini no response.' });

    let parsed;
    try { parsed = parseJSON(raw); }
    catch { return res.status(502).json({ success: false, message: 'Could not parse response.' }); }

    const variations = {
      easy:   (parsed?.variations?.easy   || []).map(q => ({ ...q, source: 'ai' })),
      medium: (parsed?.variations?.medium || []).map(q => ({ ...q, source: 'ai' })),
      hard:   (parsed?.variations?.hard   || []).map(q => ({ ...q, source: 'ai' })),
    };
    res.json({ success: true, variations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/extract-pdf ────────────────────────
exports.extractFromPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF uploaded' });

    let pdfParse;
    try { pdfParse = require('pdf-parse'); }
    catch { return res.status(500).json({ success: false, message: 'Run: npm install pdf-parse' }); }

    let pdfText = '';
    try {
      const data = await pdfParse(req.file.buffer);
      pdfText = data.text || '';
    } catch {
      return res.status(422).json({ success: false, message: 'Could not read PDF.' });
    }

    if (!pdfText.trim())
      return res.status(422).json({ success: false, message: 'PDF has no extractable text.' });

    const prompt = `Extract assignment questions from this PDF as a JSON array.
Each object: {"questionText":string,"type":"mcq"|"short"|"long","options":[],"correctAnswer":string,"marks":number,"difficulty":"easy"|"medium"|"hard","source":"uploaded"}
Return ONLY valid JSON array. No markdown.
PDF TEXT:\n${pdfText.slice(0, 6000)}`;

    const raw = await callGemini(prompt);
    if (!raw) return res.status(502).json({ success: false, message: 'Gemini could not process PDF.' });

    let questions;
    try { questions = parseJSON(raw); }
    catch { return res.status(502).json({ success: false, message: 'Could not parse PDF response.' }); }

    const sanitised = sanitiseQuestions(questions).map(q => ({ ...q, source: 'uploaded' }));
    res.json({ success: true, questions: sanitised, count: sanitised.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments ─────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, teacherId, teacherName,
            questions, dueDate, allowQuizMode, allowSolveMode,
            creationMethod, targetBucket } = req.body;

    if (!title || !courseId || !teacherId || !dueDate)
      return res.status(400).json({ success: false, message: 'title, courseId, teacherId, dueDate required' });
    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ success: false, message: 'At least one question required' });

    const assignment = new Assignment({
      title, description, courseId, teacherId,
      teacherName: teacherName || '',
      questions, dueDate: new Date(dueDate),
      allowQuizMode:  allowQuizMode  !== false,
      allowSolveMode: allowSolveMode !== false,
      creationMethod: creationMethod || 'manual',
      targetBucket:   targetBucket   || 'All',
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/assignments/:id ────────────────────────────────
exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, courseId, questions, dueDate, targetBucket, creationMethod } = req.body;
    const a = await Assignment.findByIdAndUpdate(req.params.id, {
      title, description, courseId, questions, dueDate,
      targetBucket: targetBucket || 'All',
      creationMethod: creationMethod || 'manual',
    }, { new: true });
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, assignment: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/assignments/:id/publish ───────────────────────
exports.publishAssignment = async (req, res) => {
  try {
    const a = await Assignment.findByIdAndUpdate(
      req.params.id, { isPublished: true }, { new: true }
    );
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, assignment: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/assignments/:id ───────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await AssignmentSubmission.deleteMany({ assignmentId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/course/:courseId ─────────────────────
exports.getByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId })
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id ──────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    // Strip correct answers for students
    const safe = {
      ...a.toObject(),
      questions: a.questions.map(q => ({
        _id: q._id, questionText: q.questionText,
        type: q.type, options: q.options,
        marks: q.marks, difficulty: q.difficulty,
      }))
    };
    res.json({ success: true, assignment: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/:id/submit ─────────────────────────
exports.submit = async (req, res) => {
  try {
    let { studentId, studentName, courseId, answers, mode } = req.body;
    if (typeof answers === 'string') {
      try { answers = JSON.parse(answers); } catch { answers = []; }
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check if already submitted — return existing with full correct answers
    const existing = await AssignmentSubmission.findOne({
      assignmentId: assignment._id, studentId
    });
    if (existing) {
      // Enrich with correct answers from assignment
      const enriched = existing.toObject();
      enriched.answers = enriched.answers.map(ans => {
        const q = assignment.questions.id(ans.questionId);
        return { ...ans, correctAnswer: q?.correctAnswer || ans.correctAnswer };
      });
      enriched.questions = assignment.questions; // full questions with correct answers
      return res.status(200).json({
        success: true,
        submission: enriched,
        alreadySubmitted: true,
        message: 'You have already submitted this assignment.'
      });
    }

    // ── Handle uploaded files ──────────────────────────────────
    const fileMap = {};
    if (req.files && req.files.length > 0) {
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      for (const file of req.files) {
        const qId = file.fieldname.replace('file_', '');
        const ext = path.extname(file.originalname) || '.bin';
        const filename = `${Date.now()}_${qId}${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        fileMap[qId] = `/uploads/${filename}`;
      }
    }

    // ── Auto-grade ────────────────────────────────────────────
    let totalScore = 0;
    const gradedAnswers = (answers || []).map(ans => {
      const q = assignment.questions.id(ans.questionId);
      if (!q) return {
        questionId: ans.questionId,
        questionText: '',
        studentAnswer: ans.studentAnswer || '',
        correctAnswer: '',
        marksAwarded: 0, maxMarks: 0, isCorrect: false,
        fileUrl: fileMap[ans.questionId] || ''
      };

      let isCorrect = false, marksAwarded = 0;

      if (q.type === 'mcq') {
        isCorrect    = (ans.studentAnswer || '').trim().toLowerCase() ===
                       (q.correctAnswer  || '').trim().toLowerCase();
        marksAwarded = isCorrect ? q.marks : 0;
      } else {
        const exp   = (q.correctAnswer || '').toLowerCase();
        const given = (ans.studentAnswer || '').toLowerCase();
        if (exp && given) {
          const expW  = new Set(exp.split(/\s+/).filter(w => w.length > 3));
          const givW  = new Set(given.split(/\s+/).filter(w => w.length > 3));
          const hits  = [...expW].filter(w => givW.has(w)).length;
          const ratio = expW.size > 0 ? hits / expW.size : 0;
          marksAwarded = Math.round(q.marks * Math.min(ratio, 1) * 100) / 100;
          isCorrect    = ratio >= 0.6;
        }
      }

      totalScore += marksAwarded;
      return {
        questionId:    q._id,
        questionText:  q.questionText,
        studentAnswer: ans.studentAnswer || '',
        correctAnswer: q.correctAnswer,  // store correct answer in submission
        marksAwarded,
        maxMarks:      q.marks,
        isCorrect,
        fileUrl:       fileMap[String(q._id)] || '',
      };
    });

    const totalMarks = assignment.totalMarks || 1;
    const percentage = Math.round((Math.max(0, totalScore) / totalMarks) * 10000) / 100;
    const grade      = calcGrade(percentage);

    // ── AI feedback ───────────────────────────────────────────
    let overallFeedback = '', strengths = [], improvementAreas = [];
    let plagiarismScore = 0, plagiarismFlagged = false;

    try {
      const shortLong = gradedAnswers.filter(a => {
        const q = assignment.questions.id(a.questionId);
        return q && (q.type === 'short' || q.type === 'long');
      });

      if (shortLong.length > 0) {
        const gradeText = shortLong
          .map(a => `Q: ${a.questionText}\nStudent: ${a.studentAnswer}\nExpected: ${a.correctAnswer}\nMax: ${a.maxMarks}`)
          .join('\n\n');

        const raw = await callGemini(
          `Grade these student answers.\n${gradeText}\nReturn ONLY valid JSON:\n{"gradedAnswers":[{"questionText":"...","marksAwarded":3,"maxMarks":5,"aiFeedback":"..."}],"overallFeedback":"...","strengths":["s1"],"improvementAreas":["a1"],"plagiarismScore":5}`
        );
        if (raw) {
          try {
            const r = parseJSON(raw);
            overallFeedback  = r.overallFeedback  || '';
            strengths        = r.strengths        || [];
            improvementAreas = r.improvementAreas || [];
            plagiarismScore  = r.plagiarismScore  || 0;
            plagiarismFlagged = plagiarismScore > 40;

            (r.gradedAnswers || []).forEach(ag => {
              const found = gradedAnswers.find(a => a.questionText === ag.questionText);
              if (found) {
                found.marksAwarded = Math.min(ag.marksAwarded || 0, found.maxMarks);
                found.aiFeedback   = ag.aiFeedback || '';
                totalScore += found.marksAwarded;
              }
            });
          } catch {}
        }
      } else {
        const raw = await callGemini(
          `Student scored ${percentage.toFixed(1)}% on MCQ assignment.\nReturn JSON: {"overallFeedback":"2 sentences","strengths":["s1"],"improvementAreas":["a1"]}`
        );
        if (raw) {
          try {
            const r = parseJSON(raw);
            overallFeedback  = r.overallFeedback  || '';
            strengths        = r.strengths        || [];
            improvementAreas = r.improvementAreas || [];
          } catch {}
        }
      }
    } catch { /* AI optional */ }

    const finalScore = Math.min(Math.max(0, totalScore), totalMarks);
    const finalPct   = Math.round((finalScore / totalMarks) * 10000) / 100;

    const submission = await AssignmentSubmission.create({
      assignmentId: assignment._id, courseId, studentId, studentName,
      answers: gradedAnswers,
      mode: mode || 'solve',
      totalScore: finalScore, totalMarks, percentage: finalPct,
      grade: calcGrade(finalPct),
      overallFeedback, strengths, improvementAreas,
      plagiarismScore, plagiarismFlagged,
      status: 'graded',
    });

    // Return submission WITH full question data including correct answers
    const responseSubmission = submission.toObject();
    responseSubmission.questions = assignment.questions; // include full questions

    res.status(201).json({
      success: true,
      submission: responseSubmission,
      message: 'Assignment submitted successfully!'
    });
  } catch (err) {
    console.error('[submit]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id/submissions ─────────────────────
exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignmentId: req.params.id })
      .populate('studentId', 'name email studentId department semester')
      .sort({ submittedAt: -1 });
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id/submission/:studentId ────────────
exports.getStudentSubmission = async (req, res) => {
  try {
    const sub = await AssignmentSubmission.findOne({
      assignmentId: req.params.id,
      studentId:    req.params.studentId
    });
    if (!sub) return res.status(404).json({ success: false, message: 'Not submitted yet' });

    // Enrich with correct answers from assignment
    const assignment = await Assignment.findById(req.params.id);
    const enriched = sub.toObject();
    if (assignment) {
      enriched.answers = enriched.answers.map(ans => {
        const q = assignment.questions.id(ans.questionId);
        return { ...ans, correctAnswer: q?.correctAnswer || ans.correctAnswer };
      });
      enriched.questions = assignment.questions;
    }

    res.json({ success: true, submission: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/assignments/submissions/:subId/review ─────────
exports.teacherReview = async (req, res) => {
  try {
    const { teacherComment, teacherScore } = req.body;
    const sub = await AssignmentSubmission.findByIdAndUpdate(
      req.params.subId,
      {
        teacherComment,
        teacherScore: teacherScore !== undefined && teacherScore !== null ? Number(teacherScore) : undefined,
        reviewedAt: new Date(),
        status: 'reviewed'
      },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const Assignment = require('../models/Assignment');
const multer     = require('multer');

// ── Multer (memory storage for PDF) ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'), false);
  }
});
exports.upload = upload;

// ── Grade helper ──────────────────────────────────────────────
function calcGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// ── Plagiarism: Jaccard similarity ───────────────────────────
function jaccardSim(a, b) {
  const sA = new Set(a.toLowerCase().split(/\s+/));
  const sB = new Set(b.toLowerCase().split(/\s+/));
  const inter = [...sA].filter(w => sB.has(w)).length;
  const union = new Set([...sA, ...sB]).size;
  return union === 0 ? 0 : inter / union;
}

function checkPlagiarism(assignment, newAnswers) {
  const newText = newAnswers.map(a => a.studentAnswer || '').join(' ');
  let max = 0;
  for (const sub of assignment.submissions) {
    const subText = sub.answers.map(a => a.studentAnswer || '').join(' ');
    const sim = jaccardSim(newText, subText);
    if (sim > max) max = sim;
  }
  const score = Math.round(max * 100);
  return { flagged: score > 40, score };
}

// ── Gemini helper ─────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════
// CONTROLLER EXPORTS
// ═══════════════════════════════════════════════════════════════

// ── GET /api/assignments/course/:courseId ─────────────────────
exports.getByCourse = async (req, res) => {
  try {
    const { studentId } = req.query; // optional: filter by student bucket
    let assignments = await Assignment.find({ courseId: req.params.courseId })
      .select('-submissions')
      .sort({ createdAt: -1 });

    // Filter published assignments to only those matching the student's bucket
    if (studentId) {
      const StudentBucket = require('../models/StudentBucket');
      const bucketRecord = await StudentBucket.findOne({
        studentId,
        courseId: req.params.courseId,
      });
      const studentBucket = bucketRecord?.bucket || 'Easy'; // default Easy
      assignments = assignments.map(a => {
        // If not published, return as-is (teacher view)
        if (!a.isPublished) return a;
        // If targetBucket is 'All', visible to everyone
        if (!a.targetBucket || a.targetBucket === 'All') return a;
        // If buckets match, visible
        if (a.targetBucket === studentBucket) return a;
        return null;
      }).filter(Boolean);
    }

    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id ──────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).select('-submissions');
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, assignment: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments ─────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, teacherId,
            teacherName, questions, dueDate, creationMethod, targetBucket } = req.body;

    if (!title || !courseId || !teacherId || !dueDate)
      return res.status(400).json({ success: false, message: 'title, courseId, teacherId, dueDate required' });
    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ success: false, message: 'At least one question required' });

    const assignment = new Assignment({
      title, description, courseId, teacherId,
      teacherName: teacherName || '',
      questions, dueDate: new Date(dueDate),
      creationMethod: creationMethod || 'manual',
      targetBucket: targetBucket || 'All',
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error('[createAssignment]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/assignments/:id/publish ───────────────────────
exports.publishAssignment = async (req, res) => {
  try {
    const update = { isPublished: true };
    // Optional: allow setting targetBucket at publish time
    if (req.body && req.body.targetBucket) update.targetBucket = req.body.targetBucket;
    const a = await Assignment.findByIdAndUpdate(req.params.id, update, { new: true }).select('-submissions');
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, assignment: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/assignments/:id ───────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/:id/submit ─────────────────────────
exports.submit = async (req, res) => {
  try {
    // Support both JSON body and FormData (multipart)
    let studentId, studentName, courseId, answers, mode;
    if (req.body.answers && typeof req.body.answers === 'string') {
      // FormData: answers is a JSON string
      studentId   = req.body.studentId;
      studentName = req.body.studentName;
      courseId    = req.body.courseId;
      mode        = req.body.mode;
      try { answers = JSON.parse(req.body.answers); } catch { answers = []; }
    } else {
      ({ studentId, studentName, courseId, answers, mode } = req.body);
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });

    const already = assignment.submissions.some(
      s => String(s.studentId) === String(studentId)
    );
    if (already) return res.status(400).json({ success: false, message: 'Already submitted' });

    // ── Auto-grade ────────────────────────────────────────────
    let totalScore = 0;
    const gradedAnswers = (answers || []).map(ans => {
      const q = assignment.questions.id(ans.questionId);
      if (!q) return {
        questionId: ans.questionId,
        studentAnswer: ans.studentAnswer,
        isCorrect: false, marksAwarded: 0
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
        questionId: ans.questionId,
        studentAnswer: ans.studentAnswer,
        isCorrect, marksAwarded
      };
    });

    // Always compute totalMarks dynamically from questions (prevents F grade bug when stored value is 0)
    const computedTotalMarks = assignment.questions.reduce((s, q) => s + (q.marks || 0), 0);
    const totalMarks = computedTotalMarks > 0 ? computedTotalMarks : (assignment.totalMarks || 1);
    const percentage = Math.round((Math.max(0, totalScore) / totalMarks) * 10000) / 100;
    const grade      = calcGrade(percentage);

    // ── Plagiarism ────────────────────────────────────────────
    const { flagged: plagiarismFlagged, score: plagiarismScore } =
      checkPlagiarism(assignment, answers || []);

    // ── AI feedback ───────────────────────────────────────────
    let overallFeedback = '', strengths = [], improvementAreas = [];
    try {
      const raw = await callGemini(
        `Student scored ${percentage.toFixed(1)}% (${totalScore}/${totalMarks}) on an assignment.
Give academic feedback as JSON (no markdown, no backticks):
{"overallFeedback":"...","strengths":["..."],"improvementAreas":["..."]}`
      );
      if (raw) {
        const p = parseJSON(raw);
        overallFeedback  = p.overallFeedback  || '';
        strengths        = p.strengths        || [];
        improvementAreas = p.improvementAreas || [];
      }
    } catch { /* feedback optional */ }

    // ── Save ──────────────────────────────────────────────────
    assignment.submissions.push({
      studentId, studentName, courseId,
      answers: gradedAnswers,
      totalScore: Math.max(0, totalScore),
      totalMarks, percentage, grade,
      mode: mode || 'solve',
      plagiarismFlagged, plagiarismScore,
      overallFeedback, strengths, improvementAreas,
      status: 'graded',
    });

    await assignment.save();
    const sub = assignment.submissions[assignment.submissions.length - 1];

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully!',
      submission: {
        _id: sub._id, totalScore, totalMarks, percentage, grade,
        plagiarismFlagged, plagiarismScore,
        overallFeedback, strengths, improvementAreas,
      },
    });
  } catch (err) {
    console.error('[submit]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id/submissions ──────────────────────
exports.getSubmissions = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name email studentId');
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, submissions: a.submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/assignments/:id/submission/:studentId ────────────
exports.getStudentSubmission = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    const sub = a.submissions.find(
      s => String(s.studentId) === String(req.params.studentId)
    );
    if (!sub) return res.status(404).json({ success: false, message: 'Not submitted yet' });
    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/assignments/submissions/:subId/review ─────────
exports.teacherReview = async (req, res) => {
  try {
    const { teacherComment, teacherScore } = req.body;
    const a = await Assignment.findOne({ 'submissions._id': req.params.subId });
    if (!a) return res.status(404).json({ success: false, message: 'Submission not found' });

    const sub = a.submissions.id(req.params.subId);
    if (teacherComment !== undefined) sub.teacherComment = teacherComment;
    if (teacherScore   !== undefined && teacherScore !== null) sub.teacherScore = Number(teacherScore);
    sub.status = 'reviewed';

    await a.save();
    res.json({ success: true, submission: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/gemini ──────────────────────────────
exports.callGeminiDirect = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string')
      return res.status(400).json({ success: false, message: 'prompt is required' });

    const response = await callGemini(prompt);
    res.json({ success: true, response });
  } catch (err) {
    console.error('[callGeminiDirect]', err);
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
Create: ${easyCount} easy, ${mediumCount} medium, ${hardCount} hard questions.
Mix MCQ and short-answer. MCQs must have 4 options.
Return ONLY a valid JSON array. No markdown.
Each object: {"questionText":string,"type":"mcq"|"short"|"long","options":[],"correctAnswer":string,"marks":number,"difficulty":"easy"|"medium"|"hard","source":"ai"}
Easy=5 marks, Medium=10 marks, Hard=15 marks.`;

    const raw = await callGemini(prompt);
    if (!raw) return res.status(502).json({ success: false, message: 'Gemini no response. Check API key.' });

    let questions;
    try { questions = parseJSON(raw); }
    catch { return res.status(502).json({ success: false, message: 'Could not parse Gemini response.' }); }

    const sanitised = sanitiseQuestions(questions);
    res.json({ success: true, questions: sanitised, count: sanitised.length });
  } catch (err) {
    console.error('[generateWithAI]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/extract-pdf ────────────────────────
exports.extractFromPdf = [
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  async (req, res) => {
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
        return res.status(422).json({ success: false, message: 'Could not read PDF. Use a text-based PDF.' });
      }

      if (!pdfText.trim())
        return res.status(422).json({ success: false, message: 'PDF has no extractable text.' });

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here')
        return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not set in .env' });

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
      console.error('[extractFromPdf]', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
];
// ── POST /api/assignments/generate-variations ─────────────────
// Takes a base question, returns easy/medium/hard variations
exports.generateVariations = async (req, res) => {
  try {
    const { baseQuestion, courseName, difficulty = 'all' } = req.body;
    if (!baseQuestion || !baseQuestion.trim())
      return res.status(400).json({ success: false, message: 'baseQuestion is required' });

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here')
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not set in .env' });

    // Build difficulty-specific instructions
    const diffMap = {
      easy:   'Generate ONLY 5 easy questions (basic recall/definition, straightforward). Each worth 5 marks.',
      medium: 'Generate ONLY 5 medium questions (application or analysis needed). Each worth 10 marks.',
      hard:   'Generate ONLY 5 hard questions (synthesis, evaluation, complex problem-solving). Each worth 15 marks.',
      all:    'Generate 3 easy (5 marks each), 3 medium (10 marks each), and 3 hard (15 marks each) questions.',
    };
    const diffInstruction = diffMap[difficulty] || diffMap.all;

    const prompt = `You are an expert academic question designer.
Given this base question: "${baseQuestion}"
${courseName ? `Course: "${courseName}"` : ''}

${diffInstruction}
Rules:
- All questions must be conceptually related to the base question
- Questions must be non-duplicate
- Mix MCQ and short-answer types where appropriate. MCQs must have exactly 4 options.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "easy":   [{"questionText": "...", "type": "mcq"|"short", "options": ["A","B","C","D"] or [], "correctAnswer": "...", "marks": 5,  "difficulty": "easy",   "source": "ai"}],
  "medium": [{"questionText": "...", "type": "mcq"|"short", "options": [...] or [],           "correctAnswer": "...", "marks": 10, "difficulty": "medium", "source": "ai"}],
  "hard":   [{"questionText": "...", "type": "short"|"long", "options": [],                    "correctAnswer": "...", "marks": 15, "difficulty": "hard",   "source": "ai"}]
}
${difficulty !== 'all' ? `Note: Only populate the "${difficulty}" array. Leave the other arrays empty ([]).` : ''}`;

    const raw = await callGemini(prompt);
    if (!raw) return res.status(502).json({ success: false, message: 'Gemini returned no response. Check GEMINI_API_KEY.' });

    let parsed;
    try {
      let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (!objMatch) throw new Error('No JSON object found');
      parsed = JSON.parse(objMatch[0]);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'Could not parse AI response. Try again.' });
    }

    const sanitise = (arr, difficulty) =>
      (Array.isArray(arr) ? arr : []).map(q => ({
        questionText:  String(q.questionText || '').trim(),
        type:          ['mcq','short','long'].includes(q.type) ? q.type : 'short',
        options:       Array.isArray(q.options) ? q.options.slice(0, 4) : [],
        correctAnswer: String(q.correctAnswer || ''),
        marks:         difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
        difficulty,
        source:        'ai',
      })).filter(q => q.questionText !== '');

    res.json({
      success: true,
      variations: {
        easy:   sanitise(parsed.easy,   'easy'),
        medium: sanitise(parsed.medium, 'medium'),
        hard:   sanitise(parsed.hard,   'hard'),
      }
    });
  } catch (err) {
    console.error('[generateVariations]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/assignments/ai-performance ─────────────────────
// Analyzes student quiz+assignment marks, returns structured feedback
exports.analyzePerformance = async (req, res) => {
  try {
    const { quizResults = [], assignmentResults = [], studentName = 'Student' } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here')
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not set in .env' });

    // Build performance summary
    const allResults = [
      ...quizResults.map(r => ({
        subject: r.subject || r.quizTitle || 'Quiz',
        scored:  r.scored  || r.obtainedMarks || 0,
        total:   r.total   || r.totalMarks    || 100,
        type:    'quiz',
      })),
      ...assignmentResults.map(r => ({
        subject: r.subject || r.title || 'Assignment',
        scored:  r.scored  || r.obtainedMarks || 0,
        total:   r.total   || r.totalMarks    || 100,
        type:    'assignment',
      })),
    ];

    const performanceSummary = allResults.map(r => {
      const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
      const status = pct < 50 ? 'Weak Area' : pct <= 75 ? 'Needs Improvement' : 'Strong Area';
      return `${r.type.toUpperCase()}: "${r.subject}" — ${r.scored}/${r.total} (${pct}%) → ${status}`;
    }).join('\n');

    const prompt = `You are an academic performance analyst for a Learning Management System.
Student: ${studentName}

Performance data:
${performanceSummary || 'No performance data available yet.'}

Classification rules:
- Marks < 50% → Weak Area
- Marks 50-75% → Needs Improvement
- Marks > 75% → Strong Area

Analyze the performance and return ONLY valid JSON (no markdown, no extra text):
{
  "summary": "2-3 sentence overall summary of the student's performance",
  "strengths": ["strength 1", "strength 2"],
  "areasOfImprovement": ["area 1 with subject name and percentage", "area 2"],
  "weakAreas": [{"subject": "...", "percentage": 0, "status": "Weak Area"|"Needs Improvement"|"Strong Area"}],
  "suggestedTopics": ["topic1", "topic2"],
  "improvementTips": ["actionable tip 1", "tip 2", "tip 3"],
  "overallStatus": "Needs Attention"|"On Track"|"Excellent",
  "priorityAction": "one key action for the student right now"
}`;

    const raw = await callGemini(prompt);

    if (!raw) {
      // Fallback: compute locally without AI
      const analysed = allResults.map(r => {
        const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
        return {
          subject: r.subject,
          percentage: pct,
          status: pct < 50 ? 'Weak Area' : pct <= 75 ? 'Needs Improvement' : 'Strong Area',
        };
      });
      return res.json({
        success: true,
        feedback: {
          weakAreas:       analysed.filter(a => a.status !== 'Strong Area'),
          suggestedTopics: analysed.filter(a => a.status !== 'Strong Area').map(a => `Review ${a.subject}`),
          improvementTips: ['Practice consistently', 'Review lecture notes', 'Attempt more exercises'],
          overallStatus:   analysed.some(a => a.status === 'Weak Area') ? 'Needs Attention' : 'On Track',
          priorityAction:  'Focus on your weakest subjects first',
        },
        raw: null,
      });
    }

    let feedback;
    try {
      let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (!objMatch) throw new Error('No JSON object');
      feedback = JSON.parse(objMatch[0]);
    } catch {
      // Fallback to local analysis
      const analysed = allResults.map(r => {
        const pct = r.total > 0 ? Math.round((r.scored / r.total) * 100) : 0;
        return { subject: r.subject, percentage: pct, status: pct < 50 ? 'Weak Area' : pct <= 75 ? 'Needs Improvement' : 'Strong Area' };
      });
      feedback = {
        weakAreas: analysed,
        suggestedTopics: analysed.map(a => `Review and practice ${a.subject}`),
        improvementTips: ['Study weak areas daily', 'Take practice tests', 'Ask faculty for help'],
        overallStatus: 'On Track',
        priorityAction: 'Review your weakest subject this week',
      };
    }

    res.json({ success: true, feedback });
  } catch (err) {
    console.error('[analyzePerformance]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

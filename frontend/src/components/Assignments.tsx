import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import {
  Plus, Send, Eye, Trash2, Sparkles, FileText,
  Clock, CheckCircle, Users, ChevronDown, ChevronUp,
  AlertTriangle, Star, Upload, BookOpen, Target, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StudentReviewSheet } from './StudentReviewSheet';

const API = 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────
interface Question {
  _id?: string;
  questionText: string;
  type: 'mcq' | 'short' | 'long';
  options: string[];
  correctAnswer: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  source?: 'manual' | 'ai' | 'uploaded';
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  courseId: string | { _id: string; courseName: string; courseCode: string };
  teacherName: string;
  questions: Question[];
  totalMarks: number;
  dueDate: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  isPublished: boolean;
  allowQuizMode: boolean;
  allowSolveMode: boolean;
  creationMethod: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  studentId: { name: string; email: string; studentId: string } | string;
  studentName: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: string;
  mode?: string;
  plagiarismFlagged: boolean;
  plagiarismScore: number;
  submittedAt: string;
  overallFeedback: string;
  improvementAreas: string[];
  strengths: string[];
  teacherComment: string;
  teacherScore: number | null;
  answers?: {
    questionId: string;
    studentAnswer: string;
    isCorrect?: boolean;
    marksAwarded?: number;
    aiFeedback?: string;
    fileUrl?: string;
  }[];
}

interface Course { _id: string; courseName: string; courseCode: string; }

const DIFF_COLORS: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

// ─────────────────────────────────────────────────────────────
// MAIN ASSIGNMENTS COMPONENT
// ─────────────────────────────────────────────────────────────
export function Assignments() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const location = useLocation();

  const filteredAssignments = selectedCourseId
    ? assignments.filter(a => (typeof a.courseId === 'object' ? a.courseId._id : a.courseId) === selectedCourseId)
    : assignments;

  const [viewingSubs, setViewingSubs] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const [attempting, setAttempting]   = useState<Assignment | null>(null);
  const [mode,       setMode]         = useState<'quiz' | 'solve'>('solve');
  const [reviewingSubmission, setReviewingSubmission] = useState<{ assignment: Assignment; submission: Submission } | null>(null);

  // Create form
  const [title,       setTitle]       = useState('');
  const [description, setDesc]        = useState('');
  const [courseId,    setCourseId]    = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [saving,      setSaving]      = useState(false);

  // Target bucket for publishing
  const [targetBucket, setTargetBucket] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  // AI Variation Generator (base question → difficulty-specific variations)
  const [baseQuestion,      setBaseQuestion]      = useState('');
  const [aiDifficulty,      setAiDifficulty]      = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [aiVariations,      setAiVariations]      = useState<{ easy: any[]; medium: any[]; hard: any[] }>({ easy: [], medium: [], hard: [] });
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [showVariations,    setShowVariations]    = useState(false);

  // PDF upload for AI extraction
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedCourseId(params.get('courseId') || '');
  }, [location.search]);

  // ── Load courses + assignments ────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch courses
      const cRes  = await fetch(`${API}/admin/courses`);
      const cData = await cRes.json();
      const courseList: Course[] = cData.data || cData.courses || cData || [];
      let filteredCourses = Array.isArray(courseList) ? courseList : [];

      if (isStudent && user?.id) {
        try {
          const sRes = await fetch(`${API}/admin/students/${user.id}`);
          const sJson = await sRes.json();
          const enrolledIds = new Set(
            (sJson.data?.enrolledCourses || []).map((c: any) => String(c.courseId))
          );
          filteredCourses = filteredCourses.filter(c => enrolledIds.has(String(c._id)));
        } catch {
          filteredCourses = [];
        }
      }

      setCourses(filteredCourses);

      // Fetch assignments for each course
      const allAssignments: Assignment[] = [];
      for (const c of filteredCourses) {
        try {
          const aRes  = await fetch(`${API}/assignments/course/${c._id}`);
          const aData = await aRes.json();
          if (aData.success && Array.isArray(aData.assignments)) {
            aData.assignments.forEach((a: Assignment) =>
              allAssignments.push({ ...a, courseId: c })
            );
          }
        } catch {}
      }

      setAssignments(isStudent
        ? allAssignments.filter(a => a.isPublished)
        : allAssignments
      );
    } catch (e) {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // ── AI Variation Generator: base question → easy/medium/hard ─
  const handleGenerateVariations = async () => {
    if (!baseQuestion.trim()) { setError('Enter a base question to generate variations'); return; }
    setVariationsLoading(true);
    setShowVariations(false);
    setAiVariations({ easy: [], medium: [], hard: [] });
    setError('');
    try {
      const res  = await fetch(`${API}/assignments/generate-variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseQuestion: baseQuestion.trim(),
          difficulty:   aiDifficulty,
          courseName:   courses.find(c => c._id === courseId)?.courseName || '',
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'AI generation failed'); return; }
      setAiVariations(data.variations);
      setShowVariations(true);
      setSuccess('✨ AI questions generated! Select the ones you want to add.');
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('AI generation failed. Check GEMINI_API_KEY in .env');
    } finally { setVariationsLoading(false); }
  };

  const addVariationToAssignment = (q: any) => {
    setQuestions(prev => [...prev, { ...q, source: 'ai' }]);
    setSuccess(`Added question to assignment`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // ── PDF upload → AI extract questions ────────────────────
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('courseName', courses.find(c => c._id === courseId)?.courseName || 'General');
      const res  = await fetch(`${API}/assignments/extract-pdf`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'PDF extraction failed'); return; }
      setQuestions(prev => [...prev, ...data.questions]);
      setSuccess(`📄 Extracted ${data.questions.length} questions from PDF!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('PDF extraction failed.');
    } finally {
      setPdfLoading(false);
      if (pdfRef.current) pdfRef.current.value = '';
    }
  };

  const addManualQuestion = () => {
    setQuestions(prev => [...prev, {
      questionText: '', type: 'short', options: ['', '', '', ''],
      correctAnswer: '', marks: 5, difficulty: 'medium', source: 'manual'
    }]);
  };

  const updateQ = (i: number, field: keyof Question, val: any) => {
    const q = [...questions];
    (q[i] as any)[field] = val;
    setQuestions(q);
  };

  const removeQ = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  // ── Create assignment ─────────────────────────────────────
  const handleCreate = async () => {
    setError('');
    if (!title.trim())        { setError('Title is required'); return; }
    if (!courseId)             { setError('Select a course'); return; }
    if (!dueDate)              { setError('Due date is required'); return; }
    if (questions.length < 1)  { setError('Add at least 1 question'); return; }
    if (questions.some(q => !q.questionText.trim())) { setError('All questions need text'); return; }

    setSaving(true);
    try {
      const res  = await fetch(`${API}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, courseId,
          teacherId: user?.id,
          teacherName: user?.name,
          questions, dueDate,
          creationMethod: questions.some(q => q.source === 'ai') ? 'mixed' : 'manual',
          targetBucket
        })
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to create'); return; }
      setSuccess('✅ Assignment created! Click Publish to make it visible to students.');
      resetForm(); loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch { setError('Server error. Is backend running?'); }
    finally { setSaving(false); }
  };

  const handlePublish = async (id: string) => {
    try {
      await fetch(`${API}/assignments/${id}/publish`, { method: 'PATCH' });
      loadData();
      setSuccess('Assignment published! Students can now see it.');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to publish.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment permanently?')) return;
    try {
      await fetch(`${API}/assignments/${id}`, { method: 'DELETE' });
      loadData();
    } catch { setError('Delete failed.'); }
  };

  const loadSubmissions = async (assignmentId: string) => {
    setSubsLoading(true);
    setViewingSubs(assignmentId);
    try {
      const res  = await fetch(`${API}/assignments/${assignmentId}/submissions`);
      const data = await res.json();
      if (data.success) setSubmissions(data.submissions);
    } catch {}
    finally { setSubsLoading(false); }
  };

  const handleTeacherReview = async (subId: string, comment: string, score: number) => {
    await fetch(`${API}/assignments/submissions/${subId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherComment: comment, teacherScore: score })
    });
    if (viewingSubs) loadSubmissions(viewingSubs);
  };

  const refreshSubmissions = () => {
    if (viewingSubs) loadSubmissions(viewingSubs);
  };

  const resetForm = () => {
    setTitle(''); setDesc(''); setCourseId(''); setDueDate('');
    setQuestions([]); setBaseQuestion(''); setAiVariations({ easy: [], medium: [], hard: [] }); setShowVariations(false); setTargetBucket('All');
    setShowCreate(false); setError('');
  };

  const totalM = questions.reduce((s, q) => s + (q.marks || 0), 0);

  // ── Render sub-views ──────────────────────────────────────
  if (reviewingSubmission) {
    return (
      <StudentReviewSheet
        assignment={reviewingSubmission.assignment}
        submission={reviewingSubmission.submission}
        onClose={() => { setReviewingSubmission(null); }}
      />
    );
  }

  if (attempting) {
    return (
      <AssignmentAttempt
        assignment={attempting}
        mode={mode}
        userId={user?.id || ''}
        userName={user?.name || ''}
        onClose={() => { setAttempting(null); loadData(); }}
        onViewReview={(assignment, submission) => setReviewingSubmission({ assignment, submission })}
      />
    );
  }

  if (viewingSubs) {
    const assignment = assignments.find(a => a._id === viewingSubs);
    return (
      <SubmissionsView
        assignment={assignment!}
        submissions={submissions}
        loading={subsLoading}
        onBack={() => setViewingSubs(null)}
        onReview={handleTeacherReview}
        onRefresh={refreshSubmissions}
      />
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {isTeacher ? 'Create and manage assignments for your courses.' : 'View and submit your assignments.'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => { setShowCreate(!showCreate); setError(''); }}
            style={{ backgroundColor: '#4f46e5' }}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-semibold shadow-sm hover:opacity-90 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? 'Cancel' : '+ Create Assignment'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      {/* ── CREATE FORM ── */}
      {showCreate && isTeacher && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Create New Assignment
          </h3>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Assignment 1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Course *</label>
              <select value={courseId} onChange={e => setCourseId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">Select course...</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
              <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Bucket</label>
              <div className="flex gap-2">
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map(b => (
                  <button key={b} type="button"
                    onClick={() => setTargetBucket(b)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                      targetBucket === b
                        ? b === 'Easy'   ? 'bg-green-500 text-white border-green-500'
                        : b === 'Medium' ? 'bg-yellow-500 text-white border-yellow-500'
                        : b === 'Hard'   ? 'bg-red-500 text-white border-red-500'
                        :                  'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}>
                    {b === 'All' ? '👥 All Students' : b === 'Easy' ? '🟢 Easy Bucket' : b === 'Medium' ? '🟡 Medium Bucket' : '🔴 Hard Bucket'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Only students in the selected bucket will see this assignment after publishing.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions for students</label>
              <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
                placeholder="Optional instructions..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
          </div>

          {/* ── Generate AI Questions ── */}
          <div className="rounded-xl border-2 border-violet-300 p-5 mb-5 bg-gradient-to-br from-violet-50 to-indigo-50">
            <h4 className="font-bold text-violet-900 mb-1 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-violet-600" /> Generate AI Questions
            </h4>
            <p className="text-xs text-violet-600 mb-4">Enter a base question and select difficulty — AI generates targeted variations.</p>

            {/* Base Question + Difficulty + Button */}
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-violet-700 mb-1">Base Question *</label>
                <input
                  value={baseQuestion}
                  onChange={e => setBaseQuestion(e.target.value)}
                  placeholder="e.g. Explain the concept of recursion in programming..."
                  className="w-full border border-violet-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateVariations(); }}}
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                {/* Difficulty selector */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-violet-700 mb-1">Difficulty</label>
                  <div className="flex gap-2">
                    {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setAiDifficulty(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${
                          aiDifficulty === d
                            ? d === 'easy'   ? 'bg-green-500 text-white border-green-500'
                            : d === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                            : d === 'hard'   ? 'bg-red-500 text-white border-red-500'
                            :                  'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
                        }`}
                      >
                        {d === 'all' ? '🎯 All' : d === 'easy' ? '🟢 Easy' : d === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button — visible purple */}
                <button
                  onClick={handleGenerateVariations}
                  disabled={variationsLoading || !baseQuestion.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{ backgroundColor: variationsLoading ? '#7c3aed99' : '#7c3aed' }}
                >
                  {variationsLoading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Generating...</>
                    : <><Sparkles className="w-4 h-4" /> Generate AI Questions</>}
                </button>
              </div>
            </div>

            {/* AI Generated Results */}
            {showVariations && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-violet-200">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold text-gray-700">Click "+ Add" to add questions to your assignment</p>
                </div>

                {/* Easy */}
                {aiVariations.easy.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-green-700 mb-2">🟢 Easy <span className="font-normal text-gray-400">(5 marks each)</span></p>
                    <div className="space-y-2">
                      {aiVariations.easy.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-lg hover:shadow-sm transition">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{q.questionText}</p>
                            {q.type === 'mcq' && q.options?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {q.options.map((opt: string, oi: number) => (
                                  <span key={oi} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{opt}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{q.type?.toUpperCase()} · Ans: {q.correctAnswer}</p>
                          </div>
                          <button onClick={() => addVariationToAssignment(q)}
                            className="flex-shrink-0 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition">
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medium */}
                {aiVariations.medium.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-yellow-700 mb-2">🟡 Medium <span className="font-normal text-gray-400">(10 marks each)</span></p>
                    <div className="space-y-2">
                      {aiVariations.medium.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white border border-yellow-200 rounded-lg hover:shadow-sm transition">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{q.questionText}</p>
                            {q.type === 'mcq' && q.options?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {q.options.map((opt: string, oi: number) => (
                                  <span key={oi} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{opt}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{q.type?.toUpperCase()} · Ans: {q.correctAnswer}</p>
                          </div>
                          <button onClick={() => addVariationToAssignment(q)}
                            className="flex-shrink-0 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition">
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hard */}
                {aiVariations.hard.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-700 mb-2">🔴 Hard <span className="font-normal text-gray-400">(15 marks each)</span></p>
                    <div className="space-y-2">
                      {aiVariations.hard.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white border border-red-200 rounded-lg hover:shadow-sm transition">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{q.questionText}</p>
                            {q.type === 'mcq' && q.options?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {q.options.map((opt: string, oi: number) => (
                                  <span key={oi} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{opt}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{q.type?.toUpperCase()} · Ans: {q.correctAnswer}</p>
                          </div>
                          <button onClick={() => addVariationToAssignment(q)}
                            className="flex-shrink-0 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition">
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PDF Upload */}
            <div className={showVariations ? 'border-t border-violet-200 pt-4 mt-4' : ''}>
              <p className="text-xs font-semibold text-violet-800 mb-2">📄 Or upload a PDF — AI will extract questions from it</p>
              <div className="flex items-center gap-3">
                <button onClick={() => pdfRef.current?.click()} disabled={pdfLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-300 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  {pdfLoading ? 'Extracting…' : 'Upload PDF'}
                </button>
                <span className="text-xs text-violet-500">AI reads the PDF and creates questions from it</span>
              </div>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
            </div>
          </div>

          {/* ── Questions List ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900 text-sm">
                Questions ({questions.length}) — Total: <span className="text-indigo-600">{totalM} marks</span>
              </h4>
              <button
                onClick={addManualQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold border border-gray-300 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Manually
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm">
                No questions yet. Use AI generator above or click "Add Manually".
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {questions.map((q, qi) => (
                  <div key={qi} className={`border rounded-xl p-4 ${
                    q.source === 'ai' ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">Q{qi + 1}</span>
                        {q.source === 'ai' && (
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <button onClick={() => removeQ(qi)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded">
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <textarea value={q.questionText} onChange={e => updateQ(qi, 'questionText', e.target.value)}
                        rows={2} placeholder="Question text..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">Type</label>
                          <select value={q.type} onChange={e => updateQ(qi, 'type', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none">
                            <option value="mcq">MCQ</option>
                            <option value="short">Short Answer</option>
                            <option value="long">Long Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">Difficulty</label>
                          <select value={q.difficulty} onChange={e => updateQ(qi, 'difficulty', e.target.value as any)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">Marks</label>
                          <input type="number" value={q.marks} min={1}
                            onChange={e => updateQ(qi, 'marks', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none" />
                        </div>
                      </div>

                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-2 gap-2">
                          {(q.options || ['', '', '', '']).map((opt, oi) => (
                            <input key={oi} value={opt} placeholder={`Option ${oi + 1}`}
                              onChange={e => {
                                const opts = [...(q.options || ['', '', '', ''])];
                                opts[oi] = e.target.value;
                                updateQ(qi, 'options', opts);
                              }}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none" />
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-gray-600 mb-1 font-medium">
                          {q.type === 'mcq' ? 'Correct Answer' : 'Expected Answer / Key Points'}
                        </label>
                        {q.type === 'mcq' ? (
                          <select value={q.correctAnswer} onChange={e => updateQ(qi, 'correctAnswer', e.target.value)}
                            className="w-full border border-green-400 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none">
                            <option value="">Select correct option...</option>
                            {(q.options || []).filter(o => o.trim()).map((o, oi) => (
                              <option key={oi} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={q.correctAnswer} placeholder="Expected answer or key points..."
                            onChange={e => updateQ(qi, 'correctAnswer', e.target.value)}
                            className="w-full border border-green-400 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-900 focus:outline-none" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary bar */}
          {questions.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm mb-4 flex flex-wrap gap-4 text-gray-800">
              <span>📊 Total: <strong className="text-indigo-700">{totalM} marks</strong></span>
              <span>🟢 Easy: <strong>{questions.filter(q => q.difficulty === 'easy').length}</strong></span>
              <span>🟡 Medium: <strong>{questions.filter(q => q.difficulty === 'medium').length}</strong></span>
              <span>🔴 Hard: <strong>{questions.filter(q => q.difficulty === 'hard').length}</strong></span>
              <span>✨ AI: <strong>{questions.filter(q => q.source === 'ai').length}</strong></span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ backgroundColor: saving ? '#a5b4fc' : '#4f46e5' }}
              className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-bold shadow-sm transition disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : '💾 Create Assignment'}
            </button>
            <button onClick={resetForm}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENTS LIST ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assignments yet.</p>
          {isTeacher && <p className="text-xs mt-1">Click "Create Assignment" to get started.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Filter assignments by subject</h4>
                <p className="text-xs text-gray-500">Click a course to see published assignments for that subject.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCourseId('')}
                  className={`px-3 py-1.5 text-xs rounded-full border ${selectedCourseId === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  All Subjects
                </button>
                {courses.map(course => (
                  <button
                    key={course._id}
                    onClick={() => setSelectedCourseId(course._id)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${selectedCourseId === course._id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {course.courseName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No assignments published for this subject yet.</p>
            <p className="text-xs mt-1">Try selecting another enrolled course or clear the subject filter.</p>
          </div>
        ) : filteredAssignments.map(a => {
            const course = typeof a.courseId === 'object' ? a.courseId : null;
            const isExpired = new Date(a.dueDate) < new Date();
            return (
              <div key={a._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 truncate">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                        a.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {a.isPublished ? '✅ Published' : '📝 Draft'}
                      </span>
                      {a.targetBucket && a.targetBucket !== 'All' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          a.targetBucket === 'Easy' ? 'bg-green-50 text-green-700 border-green-200'
                          : a.targetBucket === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                        }`}>🎯 {a.targetBucket} Bucket</span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex-shrink-0">
                          ⏰ Expired
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        a.creationMethod === 'ai' || a.creationMethod === 'mixed'
                          ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.creationMethod === 'mixed' ? '✨ AI + Manual' :
                         a.creationMethod === 'ai'    ? '✨ AI' : 'Manual'}
                      </span>
                    </div>

                    {/* Course + teacher */}
                    <p className="text-sm text-indigo-600 font-medium mb-1">
                      {course ? `${course.courseName} (${course.courseCode})` : '—'} · {a.teacherName}
                    </p>
                    {a.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {a.questions?.length || 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" /> {a.totalMarks} Marks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Difficulty buckets */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(a.easyCount > 0) && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">🟢 {a.easyCount} Easy</span>}
                      {(a.mediumCount > 0) && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">🟡 {a.mediumCount} Medium</span>}
                      {(a.hardCount > 0) && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">🔴 {a.hardCount} Hard</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[150px]">
                    {isTeacher && (
                      <>
                        {!a.isPublished && (
                          <button onClick={() => handlePublish(a._id)}
                            style={{ backgroundColor: '#16a34a' }}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition">
                            <Send className="w-3.5 h-3.5" /> Publish
                          </button>
                        )}
                        <button onClick={() => loadSubmissions(a._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition">
                          <Users className="w-3.5 h-3.5" /> View Submissions
                        </button>
                        <button onClick={() => handleDelete(a._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </>
                    )}
                    {isStudent && a.isPublished && !isExpired && (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => { setMode('solve'); setAttempting(a); }}
                          style={{ backgroundColor: '#4f46e5' }}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition">
                          📝 Solve Mode
                        </button>
                        <button onClick={() => { setMode('quiz'); setAttempting(a); }}
                          style={{ backgroundColor: '#7c3aed' }}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 transition">
                          ⚡ Quiz Mode
                        </button>
                      </div>
                    )}
                    {isStudent && isExpired && (
                      <span className="text-xs text-red-500 text-center font-medium py-1">
                        ⏰ Submission closed
                      </span>
                    )}
                    {isStudent && a.isPublished && !isExpired && (
                      <span className="text-xs text-gray-400 text-center">
                        Due {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ASSIGNMENT ATTEMPT (Student)
// ─────────────────────────────────────────────────────────────
function AssignmentAttempt({
  assignment, mode, userId, userName, onClose, onViewReview
}: {
  assignment: Assignment;
  mode: 'quiz' | 'solve';
  userId: string;
  userName: string;
  onClose: () => void;
  onViewReview?: (assignment: Assignment, submission: Submission) => void;
}) {
  const [answers,    setAnswers]    = useState<Record<string, string>>({});
  const [files,      setFiles]      = useState<Record<string, File>>({});
  const [currentQ,   setCurrentQ]   = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState<any>(null);
  const [error,      setError]      = useState('');
  const [timeLeft,   setTimeLeft]   = useState(mode === 'quiz' ? 30 * 60 : 0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const questions = assignment.questions;
  const total     = questions.length;

  useEffect(() => {
    if (mode !== 'quiz' || result) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, mode, result]);

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Submit assignment now?')) return;
    setSubmitting(true);
    try {
      const answersArray = questions.map(q => ({
        questionId: q._id,
        studentAnswer: answers[q._id!] || '',
        file: files[q._id!]
      }));
      const courseId = typeof assignment.courseId === 'object'
        ? assignment.courseId._id : assignment.courseId;

      const formData = new FormData();
      formData.append('studentId', userId);
      formData.append('studentName', userName);
      formData.append('courseId', courseId);
      formData.append('answers', JSON.stringify(answersArray));
      formData.append('mode', mode);

      // Append files
      Object.entries(files).forEach(([qId, file]) => {
        formData.append(`file_${qId}`, file);
      });

      const res = await fetch(`${API}/assignments/${assignment._id}/submit`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Submission failed'); return; }
      setResult(data.submission);
    } catch { setError('Submission failed. Check backend.'); }
    finally { setSubmitting(false); }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const generateRecommendations = async (submission: any) => {
    try {
      const weakAreas = submission.answers.filter((a: any) => !a.isCorrect).map((a: any) => {
        const q = questions.find(qq => String(qq._id) === String(a.questionId));
        return q?.questionText || 'Unknown question';
      });
      const prompt = `Based on the student's performance in assignment "${assignment.title}", they struggled with: ${weakAreas.join(', ')}. Provide 3-5 study recommendations.`;
      // For now, simulate AI response
      const recs = [
        'Review basic concepts in the weak areas.',
        'Practice similar questions.',
        'Seek help from teacher or peers.',
        'Use online resources for additional explanations.'
      ];
      setRecommendations(recs);
      // Store in localStorage for dashboard
      const existing = JSON.parse(localStorage.getItem('aiRecommendations') || '[]');
      existing.push({ assignment: assignment.title, recommendations: recs, date: new Date().toISOString() });
      localStorage.setItem('aiRecommendations', JSON.stringify(existing));
    } catch (err) {
      console.error('Failed to generate recommendations', err);
    }
  };

  // Result screen
  if (result) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className={`rounded-2xl p-8 text-white text-center mb-6 shadow-lg ${
          result.percentage >= 80 ? 'bg-gradient-to-br from-green-500 to-green-700' :
          result.percentage >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          <div className="text-5xl mb-3">
            {result.percentage >= 80 ? '🏆' : result.percentage >= 60 ? '✅' : '📚'}
          </div>
          <h2 className="text-xl font-bold mb-2">{assignment.title}</h2>
          <div className="text-5xl font-black my-3">{result.percentage?.toFixed(1)}%</div>
          <p className="text-lg">{result.totalScore} / {result.totalMarks} marks · Grade: <strong>{result.grade}</strong></p>
          {result.plagiarismFlagged && (
            <div className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm">
              ⚠️ Plagiarism detected ({result.plagiarismScore}%) — Teacher will review
            </div>
          )}
        </div>

        {result.overallFeedback && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Feedback
            </h3>
            <p className="text-sm text-gray-700 mb-3">{result.overallFeedback}</p>
            {result.strengths?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-bold text-green-700 mb-1">✅ Strengths</p>
                {result.strengths.map((s: string, i: number) => (
                  <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span> {s}
                  </p>
                ))}
              </div>
            )}
            {result.improvementAreas?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-orange-700 mb-1">📈 Areas to Improve</p>
                {result.improvementAreas.map((a: string, i: number) => (
                  <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span> {a}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {(result.teacherComment || result.teacherScore !== null) && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" /> Teacher Review
            </h3>
            {result.teacherComment && <p className="text-sm text-gray-700 mb-2">{result.teacherComment}</p>}
            {result.teacherScore !== null && result.teacherScore !== result.totalScore && (
              <p className="text-sm text-gray-700">Adjusted Score: {result.teacherScore} / {result.totalMarks} marks</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-indigo-500" /> AI Study Assistant
          </h3>
          <p className="text-sm text-gray-700 mb-3">Get personalized recommendations to improve your weak areas.</p>
          <button onClick={() => generateRecommendations(result)}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition">
            🤖 Get Recommendations
          </button>
          {recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Your Recommendations:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          {onViewReview && (
            <button onClick={() => onViewReview(assignment, result)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-100 transition text-sm">
              📋 View Full Review Sheet
            </button>
          )}
          <button onClick={onClose}
            style={{ backgroundColor: '#4f46e5' }}
            className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition">
            ← Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  // Quiz mode
  if (mode === 'quiz') {
    const q = questions[currentQ];
    if (!q) return null;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-md ${
          timeLeft <= 60 ? 'bg-red-600' : 'bg-indigo-700'
        }`}>
          <h1 className="text-white font-bold text-lg truncate max-w-xs">{assignment.title} — Quiz Mode</h1>
          <div className={`px-6 py-2 rounded-full font-mono font-bold text-lg min-w-[8rem] text-center ${
            timeLeft <= 60 ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'
          }`}>
            ⏱ {fmt(timeLeft)}
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-6">
          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <div className="flex justify-between mb-3 text-sm text-gray-500">
              <span>Q{currentQ + 1} of {total}</span>
              <span className={`px-3 py-1 rounded-full font-medium ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">{q.questionText}</h3>
            {q.type === 'mcq' ? (
              <div className="space-y-3">
                {(q.options || []).filter(o => o.trim()).map((opt, oi) => {
                  const answerKey = q._id || `question-${currentQ}`;
                  return (
                    <label key={oi} className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                      answers[answerKey] === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-gray-200 hover:border-gray-300 text-gray-800'
                    }`}>
                      <input type="radio" name={answerKey} value={opt} checked={answers[answerKey] === opt}
                        onChange={() => setAnswers(p => ({...p, [answerKey]: opt}))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                      <span className="text-base font-medium">{String.fromCharCode(65 + oi)}. {opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea rows={4} placeholder="Your answer..."
                value={answers[q._id!] || ''}
                onChange={e => setAnswers(p => ({...p, [q._id!]: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            )}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
              className="px-8 py-4 bg-white border border-gray-300 rounded-lg text-gray-700 text-base hover:bg-gray-50 disabled:opacity-40 font-semibold">
              ← Previous
            </button>
            {currentQ === total - 1 ? (
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                style={{ backgroundColor: '#4f46e5' }}
                className="px-10 py-4 text-white rounded-lg font-bold text-base hover:opacity-90 disabled:opacity-50">
                {submitting ? 'Submitting...' : '✅ Submit Quiz'}
              </button>
            ) : (
              <button onClick={() => setCurrentQ(q => Math.min(total - 1, q + 1))}
                style={{ backgroundColor: '#4f46e5' }}
                className="px-8 py-4 text-white rounded-lg font-semibold text-base hover:opacity-90">
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Solve mode
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{assignment.title}</h2>
          <p className="text-sm text-gray-500">Solve Mode — answer all questions then submit</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          ← Back
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {assignment.description && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-5 text-sm text-indigo-800">
          📋 {assignment.description}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {questions.map((q, qi) => (
          <div key={q._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-bold text-gray-800 text-sm">Q{qi + 1}.</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
              <span className="text-xs text-gray-400 ml-auto">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>
            <p className="font-medium text-gray-900 mb-4 text-sm">{q.questionText}</p>
            {q.type === 'mcq' ? (
              <div className="space-y-2">
                {(q.options || []).filter(o => o.trim()).map((opt, oi) => {
                  const answerKey = q._id || `question-${qi}`;
                  return (
                    <label key={oi} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      answers[answerKey] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name={answerKey} value={opt} checked={answers[answerKey] === opt}
                        onChange={() => setAnswers(p => ({...p, [answerKey]: opt}))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-800">{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <textarea rows={q.type === 'long' ? 6 : 3}
                  placeholder={q.type === 'long' ? 'Write a detailed answer...' : 'Your answer...'}
                  value={answers[q._id!] || ''}
                  onChange={e => setAnswers(p => ({...p, [q._id!]: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or upload handwritten answer (PDF/DOCX):
                  </label>
                  <input type="file" accept=".pdf,.docx,.doc"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setFiles(p => ({...p, [q._id!]: file}));
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  {files[q._id!] && (
                    <p className="text-xs text-green-600 mt-1">📎 {files[q._id!].name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {Object.values(answers).filter(a => a.trim()).length} / {total} answered
        </p>
        <button onClick={() => handleSubmit(false)} disabled={submitting}
          style={{ backgroundColor: '#4f46e5' }}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition text-sm">
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting & AI Grading...' : 'Submit Assignment'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBMISSIONS VIEW (Teacher)
// ─────────────────────────────────────────────────────────────
function SubmissionsView({
  assignment, submissions, loading, onBack, onReview, onRefresh
}: {
  assignment: Assignment;
  submissions: Submission[];
  loading: boolean;
  onBack: () => void;
  onReview: (subId: string, comment: string, score: number) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [scores,   setScores]   = useState<Record<string, number>>({});
  const [aiQLoading,  setAiQLoading]  = useState<string | null>(null);
  const [aiQFeedback, setAiQFeedback] = useState<Record<string, string>>({});
  const reviewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // AI recommendation for a single question (teacher view)
  const getAIQuestionRec = async (subId: string, questionId: string, questionText: string, studentAnswer: string, correctAnswer: string) => {
    const key = `${subId}_${questionId}`;
    setAiQLoading(key);
    try {
      const prompt = `Teacher is reviewing a student submission. Give 2-3 short teaching recommendations:\n\nQuestion: "${questionText}"\nStudent's Answer: "${studentAnswer || 'No answer'}"\nCorrect Answer: "${correctAnswer}"\n\nProvide practical tips on what the student should study or practice.`;
      const res = await fetch(`${API}/assignments/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setAiQFeedback(prev => ({ ...prev, [key]: data.response }));
      }
    } catch (err) {
      console.error('AI question recommendation failed', err);
    } finally {
      setAiQLoading(null);
    }
  };

  const handleAutoGrade = async (subId: string) => {
    const sub = submissions.find(s => s._id === subId);
    if (!sub || !sub.answers) return;
    const gradedAnswers = (sub.answers || []).map(ans => {
      const q = (assignment.questions || []).find(qq => String(qq._id) === String(ans.questionId));
      if (!q) return ans;
      let isCorrect = false;
      let marksAwarded = 0;
      if (q.type === 'mcq') {
        isCorrect = (ans.studentAnswer || '').trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
        marksAwarded = isCorrect ? q.marks : 0;
      } else {
        const exp = (q.correctAnswer || '').toLowerCase();
        const given = (ans.studentAnswer || '').toLowerCase();
        if (exp && given) {
          const expW = new Set(exp.split(/\s+/).filter(w => w.length > 3));
          const givW = new Set(given.split(/\s+/).filter(w => w.length > 3));
          const hits = [...expW].filter(w => givW.has(w)).length;
          const ratio = expW.size > 0 ? hits / expW.size : 0;
          marksAwarded = Math.round(q.marks * Math.min(ratio, 1) * 100) / 100;
          isCorrect = ratio >= 0.6;
        }
      }
      return { ...ans, isCorrect, marksAwarded };
    });
    const totalScore = gradedAnswers.reduce((s: number, a: any) => s + (a.marksAwarded || 0), 0);
    await fetch(`${API}/assignments/submissions/${subId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherComment: 'Auto-graded by system', teacherScore: Math.round(totalScore * 100) / 100 })
    });
    onRefresh();
  };

  const handleAIGrade = async (subId: string) => {
    const sub = submissions.find(s => s._id === subId);
    if (!sub) return;
    try {
      const prompt = `You are an academic AI grader. Review this student submission for assignment "${assignment.title}".

Answers: ${JSON.stringify((sub.answers || []).map(ans => {
  const q = (assignment.questions || []).find(qq => String(qq._id) === String(ans.questionId));
  return { question: q?.questionText || 'Q', studentAnswer: ans.studentAnswer, correctAnswer: q?.correctAnswer || '', marksAwarded: ans.marksAwarded, totalMarks: q?.marks || 0 };
}))}

Provide a brief, constructive teacher feedback comment (2-3 sentences) on the student's overall performance.`;
      const res = await fetch(`${API}/assignments/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const aiComment = (data.success && data.response) ? data.response : 'AI review: Good effort. Please review the incorrect answers.';
      await fetch(`${API}/assignments/submissions/${subId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherComment: aiComment, teacherScore: sub.teacherScore ?? sub.totalScore })
      });
      onRefresh();
    } catch (err) {
      console.error('AI grading failed', err);
    }
  };

  useEffect(() => {
    if (!expanded) return;
    const target = reviewRefs.current[expanded];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, [expanded]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center text-gray-400 gap-2">
      <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      Loading submissions...
    </div>
  );

  const avgScore = submissions.length
    ? (submissions.reduce((s, sub) => s + (sub.percentage || 0), 0) / submissions.length).toFixed(1)
    : '0';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-5 text-sm font-semibold">
        ← Back to Assignments
      </button>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">{assignment?.title}</h2>
        <p className="text-sm text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} · Avg: {avgScore}%</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Submissions', value: submissions.length, color: 'text-gray-900' },
          { label: 'Average Score', value: avgScore + '%', color: 'text-green-600' },
          { label: 'Plagiarism Flags', value: submissions.filter(s => s.plagiarismFlagged).length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => {
            const student = typeof sub.studentId === 'object' ? sub.studentId : null;
            const isOpen  = expanded === sub._id;
            return (
              <div key={sub._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-gray-900 text-sm">{student?.name || sub.studentName}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        (sub.percentage || 0) >= 80 ? 'bg-green-100 text-green-700' :
                        (sub.percentage || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {(sub.percentage || 0).toFixed(1)}% · {sub.grade}
                      </span>
                      {sub.plagiarismFlagged && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1 flex-shrink-0">
                          <AlertTriangle className="w-3 h-3" /> {sub.plagiarismScore}%
                        </span>
                      )}
                      {sub.status === 'reviewed' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 flex-shrink-0">
                          <CheckCircle className="w-3 h-3" /> Reviewed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {student?.email || '—'} · {sub.totalScore}/{sub.totalMarks} marks ·
                      {sub.mode ? ` ${sub.mode} mode ·` : ''} {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : sub._id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 border border-indigo-200 rounded-full text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isOpen ? 'Hide Review' : 'Review Answers'}
                    </button>
                    <span className="text-xs text-gray-500">Open to see the answer details and add teacher feedback.</span>
                  </div>
                </div>

                {isOpen && (
                  <div ref={el => { if (el) reviewRefs.current[sub._id] = el; }} className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    {sub.overallFeedback && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Feedback
                        </p>
                        <p className="text-sm text-gray-700 mb-2">{sub.overallFeedback}</p>
                        {sub.strengths?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-green-700 mb-1">Strengths:</p>
                            {sub.strengths.map((s, i) => <p key={i} className="text-xs text-gray-600">• {s}</p>)}
                          </div>
                        )}
                        {sub.improvementAreas?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-orange-700 mb-1">Improvement Areas:</p>
                            {sub.improvementAreas.map((a, i) => <p key={i} className="text-xs text-gray-600">• {a}</p>)}
                          </div>
                        )}
                      </div>
                    )}

                    {(sub.answers?.length ?? 0) > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-bold text-gray-900 mb-3">Student Answers</p>
                        <div className="space-y-3">
                          {(sub.answers || []).map((ans, idx) => {
                            const question = (assignment.questions || []).find(q => String(q._id) === String(ans.questionId));
                            const qKey = `${sub._id}_${ans.questionId}`;
                            return (
                              <div key={`${ans.questionId}-${idx}`} className={`rounded-lg p-3 border ${ans.isCorrect === false ? 'bg-red-50 border-red-200' : ans.isCorrect === true ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Q{idx + 1}: {question?.difficulty || 'Question'}</p>
                                  {/* AI Recommendation Button */}
                                  <button
                                    onClick={() => getAIQuestionRec(sub._id, ans.questionId, question?.questionText || '', ans.studentAnswer || '', question?.correctAnswer || '')}
                                    disabled={aiQLoading === qKey}
                                    title="Get AI teaching recommendations for this question"
                                    className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold hover:bg-purple-100 transition disabled:opacity-50 flex-shrink-0"
                                  >
                                    {aiQLoading === qKey ? (
                                      <span className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    AI
                                  </button>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{question?.questionText || 'Question text unavailable'}</p>
                                <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Student's Answer:</span> {ans.studentAnswer || 'No text answer provided'}</p>
                                {/* Show correct answer highlighted */}
                                {question?.correctAnswer && (
                                  <p className="text-sm text-green-800 bg-green-100 rounded px-2 py-1 mb-1">
                                    <span className="font-semibold">✅ Correct Answer:</span> {question.correctAnswer}
                                  </p>
                                )}
                                {ans.fileUrl && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-600 mb-1">📎 Handwritten Submission:</p>
                                    <a href={`${API}${ans.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100">
                                      <Eye className="w-3 h-3" /> View File
                                    </a>
                                  </div>
                                )}
                                {typeof ans.isCorrect === 'boolean' && (
                                  <p className={`text-xs font-semibold mt-1 ${ans.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                    {ans.isCorrect ? '✅ Correct' : '❌ Incorrect'} · {ans.marksAwarded ?? 0}/{question?.marks ?? 0} marks
                                  </p>
                                )}
                                {/* AI Question Recommendation */}
                                {aiQFeedback[qKey] && (
                                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-xs font-bold text-purple-700 mb-1">🤖 AI Teaching Recommendations:</p>
                                    {aiQFeedback[qKey].split('\n').map((line, li) =>
                                      line.trim() && <p key={li} className="text-xs text-purple-900">• {line.trim()}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 text-sm text-gray-500 rounded-lg border border-gray-200 p-4">
                        Student answers are not available for this submission.
                      </div>
                    )}

                    {/* Grading Options */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-sm font-bold text-gray-900 mb-3">Grading Options</p>
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => handleAutoGrade(sub._id)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition">
                          🔄 Auto Grade
                        </button>
                        <button onClick={() => handleAIGrade(sub._id)}
                          className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-semibold hover:bg-purple-100 transition">
                          🤖 AI Grade
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-sm font-bold text-gray-900 mb-3">Your Review</p>
                      {sub.teacherComment && (
                        <p className="text-xs text-gray-500 mb-3 italic bg-gray-50 p-2 rounded">
                          Previous comment: "{sub.teacherComment}"
                          {sub.teacherScore !== null ? ` · Override score: ${sub.teacherScore}/${sub.totalMarks}` : ''}
                        </p>
                      )}
                      <textarea
                        placeholder="Add your comments for this student..."
                        value={comments[sub._id] ?? ''}
                        onChange={e => setComments(p => ({...p, [sub._id]: e.target.value}))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-600">Override Score (out of {sub.totalMarks}):</label>
                          <input type="number" min={0} max={sub.totalMarks}
                            value={scores[sub._id] ?? (sub.teacherScore !== null && sub.teacherScore !== undefined ? sub.teacherScore : sub.totalScore)}
                            onChange={e => setScores(p => ({...p, [sub._id]: Number(e.target.value)}))}
                            className="w-24 border-2 border-indigo-300 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          <span className="text-xs text-gray-400">/ {sub.totalMarks} marks</span>
                        </div>
                        <button
                          onClick={() => onReview(sub._id, comments[sub._id] || '', scores[sub._id] ?? (sub.teacherScore !== null && sub.teacherScore !== undefined ? sub.teacherScore : sub.totalScore))}
                          style={{ backgroundColor: '#4f46e5' }}
                          className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
                          Save Review
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
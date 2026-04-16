import { useState } from 'react';
import {
  Sparkles, Loader2, Edit2, Check, X, RotateCcw, ChevronDown, ChevronUp,
  AlertCircle, Minus, Plus, Shuffle, Save, Send,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AIQuestion {
  questionText: string;
  type: 'mcq';
  options: string[];
  correctAnswer: string;
  marks: number;
  level: 'Beginner' | 'Medium' | 'Hard';
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000';

const LEVEL_STYLE = {
  Beginner: { badge: 'bg-green-100 text-green-700 border-green-200',   header: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
  Medium:   { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', header: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  Hard:     { badge: 'bg-red-100 text-red-700 border-red-200',         header: 'bg-red-50 border-red-200',      dot: 'bg-red-500' },
};

// FEATURE 2: Bucket options with icons and descriptions
const BUCKET_OPTIONS = [
  { value: 'Easy',   label: '🟢 Easy',   desc: 'Beginner-level students',   bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-700'  },
  { value: 'Medium', label: '🟡 Medium', desc: 'Intermediate-level students', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  { value: 'Hard',   label: '🔴 Hard',   desc: 'Advanced-level students',    bg: 'bg-red-50',    border: 'border-red-300',   text: 'text-red-700'   },
];

function StarBadge({ level }: { level: 'Beginner' | 'Medium' | 'Hard' }) {
  const count = level === 'Beginner' ? 1 : level === 'Medium' ? 3 : 5;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 text-sm" title={`${level} – ${count}/5 stars`}>
      {Array.from({ length: 5 }, (_, i) => <span key={i}>{i < count ? '★' : '☆'}</span>)}
    </span>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Single editable question card ─────────────────────────────────────────────
function QuestionCard({ q, index, onUpdate, onRemove }: {
  q: AIQuestion; index: number;
  onUpdate: (updated: AIQuestion) => void; onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState<AIQuestion>({ ...q });
  const style = LEVEL_STYLE[q.level];

  const save   = () => { onUpdate(draft); setEditing(false); };
  const cancel = () => { setDraft({ ...q }); setEditing(false); };

  return (
    <div className={`rounded-lg border ${style.header} overflow-hidden`}>
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${style.header}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Q{index + 1}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>{q.level}</span>
          <StarBadge level={q.level} />
          <span className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={save} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={cancel} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
            </>
          )}
          <button onClick={onRemove} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-white px-4 py-3 space-y-3">
        {editing ? (
          <>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={draft.questionText}
              onChange={e => setDraft({ ...draft, questionText: e.target.value })}
              placeholder="Question text..."
            />
            <div className="grid grid-cols-2 gap-2">
              {draft.options.map((opt, oi) => (
                <input key={oi} type="text" value={opt}
                  onChange={e => {
                    const opts = [...draft.options]; const oldOpt = opts[oi];
                    opts[oi] = e.target.value;
                    const newCorrect = draft.correctAnswer === oldOpt ? e.target.value : draft.correctAnswer;
                    setDraft({ ...draft, options: opts, correctAnswer: newCorrect });
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${oi + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Correct Answer</label>
                <select value={draft.correctAnswer} onChange={e => setDraft({ ...draft, correctAnswer: e.target.value })}
                  className="w-full px-3 py-1.5 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {draft.options.filter(o => o.trim()).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Marks</label>
                <input type="number" min={1} value={draft.marks}
                  onChange={e => setDraft({ ...draft, marks: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-500 mb-1">Level</label>
                <select value={draft.level} onChange={e => setDraft({ ...draft, level: e.target.value as AIQuestion['level'] })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-800 font-medium">{q.questionText}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {q.options.map((opt, oi) => (
                <div key={oi}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${opt === q.correctAnswer ? 'border-green-400 bg-green-50 text-green-800 font-semibold' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                >
                  {String.fromCharCode(65 + oi)}. {opt}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface AIQuizGeneratorProps {
  courses: Course[];
  onClose: () => void;
  onSaved: () => void;
}

export function AIQuizGenerator({ courses, onClose, onSaved }: AIQuizGeneratorProps) {
  const { user } = useAuth();

  // Generation form state
  const [topic, setTopic]       = useState('');
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [perLevel, setPerLevel] = useState(5);
  const [quizTitle, setQuizTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [dueDate, setDueDate]     = useState('');

  // FEATURE 2: Multi-bucket selection (all buckets shown, faculty picks one or more)
  // quizDifficulty stores the PUBLISHED target bucket (for student filtering)
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set(['Easy', 'Medium', 'Hard']));
  const [quizDifficulty, setQuizDifficulty]   = useState(''); // publishing target

  // Negative marking
  const [negEnabled, setNegEnabled] = useState(false);
  const [negMarks, setNegMarks]     = useState(0.25);

  // Questions state
  const [questions, setQuestions]   = useState<AIQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [genError, setGenError]     = useState('');
  const [saveError, setSaveError]   = useState('');

  // Section collapse state
  const [showBeginners, setShowBeginners] = useState(true);
  const [showMedium, setShowMedium]       = useState(true);
  const [showHard, setShowHard]           = useState(true);

  // FEATURE 2: Toggle a bucket in/out of the selected set
  const toggleBucket = (bucket: string) => {
    setSelectedBuckets(prev => {
      const next = new Set(prev);
      if (next.has(bucket)) {
        if (next.size > 1) next.delete(bucket); // always keep at least 1 selected
      } else {
        next.add(bucket);
      }
      return next;
    });
  };

  // ── FEATURE 3: Fast generation ─────────────────────────────────────────────
  // We reduce questionsPerLevel to a smaller number for quick results, and
  // generate only for selected buckets. The prompt is more concise and
  // targeted, reducing response size = faster generation.
  const handleGenerate = async () => {
    if (!topic.trim()) { setGenError('Please enter a topic.'); return; }
    setGenerating(true);
    setGenError('');
    try {
      const selectedCourse = courses.find(c => c._id === courseId);
      // Build level list based on selected buckets for faster targeted generation
      const bucketToLevel: Record<string, string> = { Easy: 'Beginner', Medium: 'Medium', Hard: 'Hard' };
      const levelsToGenerate = [...selectedBuckets].map(b => bucketToLevel[b]);

      const res = await fetch(`${API}/api/quizzes/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          questionsPerLevel: perLevel,
          subject: selectedCourse?.courseName || '',
          levels: levelsToGenerate,  // FEATURE 3: Only generate requested levels
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.message || 'Generation failed'); return; }

      // Filter to only selected bucket levels
      const levelFilter = new Set(levelsToGenerate);
      const filteredQs = (data.questions || []).filter((q: AIQuestion) => levelFilter.has(q.level));
      setQuestions(filteredQs);
      if (!quizTitle) setQuizTitle(`${topic} Quiz – AI Generated`);
    } catch (err: any) {
      setGenError('Network error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleShuffle  = () => setQuestions(q => shuffle(q));
  const updateQuestion = (idx: number, updated: AIQuestion) =>
    setQuestions(prev => prev.map((q, i) => (i === idx ? updated : q)));
  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  // ── FEATURE 4: Save with bucket targeting ─────────────────────────────────
  const handleSave = async (publish = false) => {
    if (!courseId)           { setSaveError('Select a course.'); return; }
    if (!quizTitle.trim())   { setSaveError('Quiz title is required.'); return; }
    if (questions.length === 0) { setSaveError('No questions to save.'); return; }

    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitle.trim(),
          courseId,
          createdBy: user?.id,
          questions,
          timeLimit,
          dueDate: dueDate || undefined,
          // FEATURE 4: quiz difficulty = target bucket (only matching students see it)
          difficulty: quizDifficulty || null,
          negativeMarking: { enabled: negEnabled, marksPerQuestion: negMarks },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.message || 'Save failed'); return; }

      if (publish) {
        await fetch(`${API}/api/quizzes/${data.quiz._id}/publish`, { method: 'PATCH' });
      }
      onSaved();
    } catch (err: any) {
      setSaveError('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const byLevel   = (level: AIQuestion['level']) => questions.filter(q => q.level === level);
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">AI Quiz Generator</h3>
            <p className="text-purple-200 text-sm">Powered by Gemini — generates Beginner / Medium / Hard questions</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
      </div>

      <div className="p-6 space-y-6" style={{ overflowY: 'auto', flex: '1 1 0', minHeight: 0 }}>

        {/* ── Generation Config ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> Generation Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Newton's Laws of Motion, SQL Joins, Photosynthesis…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select value={courseId} onChange={e => setCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                {courses.map(c => <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Questions per level</label>
              <select value={perLevel} onChange={e => setPerLevel(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} per level ({n * selectedBuckets.size} total)</option>)}
              </select>
            </div>
          </div>

          {/* FEATURE 2: Bucket selection — all buckets visible, faculty selects one or more */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generate questions for buckets <span className="text-gray-400 font-normal">(select one or more)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUCKET_OPTIONS.map(bucket => {
                const isSelected = selectedBuckets.has(bucket.value);
                return (
                  <button
                    key={bucket.value}
                    type="button"
                    onClick={() => toggleBucket(bucket.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-semibold
                      ${isSelected
                        ? `${bucket.bg} ${bucket.border} ${bucket.text} shadow-sm`
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-lg">{bucket.label.split(' ')[0]}</span>
                    <span>{bucket.value}</span>
                    <span className="text-xs font-normal opacity-75">{bucket.desc}</span>
                    {isSelected && (
                      <span className="mt-0.5 text-xs px-2 py-0.5 bg-white/70 rounded-full">✓ Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedBuckets.size === 3
                ? 'All buckets selected — generates questions for every level'
                : `Generating for: ${[...selectedBuckets].join(', ')} bucket${selectedBuckets.size > 1 ? 's' : ''}`
              }
            </p>
          </div>

          {genError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {genError}
            </div>
          )}

          <div className="mt-5 flex gap-3 justify-end items-center">
            {questions.length > 0 && (
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-2 px-4 py-2 border-2 border-orange-400 text-orange-600 rounded-xl hover:bg-orange-50 text-sm font-semibold disabled:opacity-50 transition-all"
              ><RotateCcw className="w-4 h-4" /> Regenerate</button>
            )}
            <button onClick={handleGenerate} disabled={generating || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
              style={{
                background: generating ? '#f97316' : 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                boxShadow: generating ? 'none' : '0 4px 15px rgba(249,115,22,0.4)',
              }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Generating…' : questions.length ? '✨ Re-generate' : '✨ Generate Questions'}
            </button>
          </div>
        </div>

        {/* ── Questions grouped by level ── */}
        {questions.length > 0 && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              {(['Beginner', 'Medium', 'Hard'] as const).map(lv => {
                const count = byLevel(lv).length;
                if (count === 0) return null;
                const style = LEVEL_STYLE[lv];
                return (
                  <div key={lv} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${style.badge}`}>
                    <StarBadge level={lv} />
                    <span>{count} {lv}</span>
                  </div>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">{questions.length} questions · {totalMarks} total marks</span>
                <button onClick={handleShuffle}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-medium"
                ><Shuffle className="w-3.5 h-3.5" /> Shuffle All</button>
              </div>
            </div>

            {byLevel('Beginner').length > 0 && (
              <div>
                <button onClick={() => setShowBeginners(v => !v)} className="flex items-center gap-2 w-full text-left mb-2">
                  <span className="text-sm font-semibold text-green-700">★☆☆☆☆ Beginner ({byLevel('Beginner').length})</span>
                  {showBeginners ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showBeginners && (
                  <div className="space-y-3">
                    {questions.map((q, i) => q.level !== 'Beginner' ? null : (
                      <QuestionCard key={i} q={q} index={i} onUpdate={u => updateQuestion(i, u)} onRemove={() => removeQuestion(i)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {byLevel('Medium').length > 0 && (
              <div>
                <button onClick={() => setShowMedium(v => !v)} className="flex items-center gap-2 w-full text-left mb-2">
                  <span className="text-sm font-semibold text-yellow-700">★★★☆☆ Medium ({byLevel('Medium').length})</span>
                  {showMedium ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showMedium && (
                  <div className="space-y-3">
                    {questions.map((q, i) => q.level !== 'Medium' ? null : (
                      <QuestionCard key={i} q={q} index={i} onUpdate={u => updateQuestion(i, u)} onRemove={() => removeQuestion(i)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {byLevel('Hard').length > 0 && (
              <div>
                <button onClick={() => setShowHard(v => !v)} className="flex items-center gap-2 w-full text-left mb-2">
                  <span className="text-sm font-semibold text-red-700">★★★★★ Hard ({byLevel('Hard').length})</span>
                  {showHard ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showHard && (
                  <div className="space-y-3">
                    {questions.map((q, i) => q.level !== 'Hard' ? null : (
                      <QuestionCard key={i} q={q} index={i} onUpdate={u => updateQuestion(i, u)} onRemove={() => removeQuestion(i)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Quiz Settings ── */}
        {questions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h4 className="font-semibold text-gray-900">Quiz Settings</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                <input type="text" value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                <input type="number" min={5} max={180} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              {/* FEATURE 4: Target bucket for publishing — who sees this quiz */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publish To Bucket <span className="text-gray-400 font-normal">(FEATURE 4: limits visibility to bucket students)</span>
                </label>
                <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">All Students</option>
                  <option value="Easy">🟢 Easy bucket only</option>
                  <option value="Medium">🟡 Medium bucket only</option>
                  <option value="Hard">🔴 Hard bucket only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {quizDifficulty
                    ? `Only students in the ${quizDifficulty} bucket will see this quiz when published.`
                    : 'All students will see this quiz when published.'
                  }
                </p>
              </div>
            </div>

            {/* Negative Marking */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Negative Marking</p>
                  <p className="text-xs text-gray-500">Deduct marks for incorrect answers</p>
                </div>
                <button type="button" onClick={() => setNegEnabled(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${negEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
                ><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${negEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></button>
              </div>
              {negEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 whitespace-nowrap">Marks deducted per wrong answer:</label>
                  <input type="number" min={0.25} step={0.25} value={negMarks}
                    onChange={e => setNegMarks(Math.max(0.25, Number(e.target.value)))}
                    className="w-24 px-3 py-1.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-semibold text-red-700"
                  />
                  <span className="text-xs text-gray-500">(skipped questions not penalised)</span>
                </div>
              )}
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800">
              <span className="font-semibold">{questions.length}</span> questions ·{' '}
              <span className="font-semibold">{totalMarks}</span> total marks ·{' '}
              <span className="font-semibold">{timeLimit} min</span>
              {quizDifficulty && <> · <span className="font-semibold">→ {quizDifficulty} students</span></>}
              {negEnabled && <> · <span className="text-red-700 font-semibold">–{negMarks} per wrong answer</span></>}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {questions.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
            Cancel
          </button>
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 border border-green-500 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium disabled:opacity-50"
          ><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save as Draft'}</button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50 shadow-sm"
          ><Send className="w-4 h-4" />{saving ? 'Saving…' : 'Save & Publish'}</button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, Clock, Award, Send, ChevronDown, X, Sparkles, Shield, Users, PenLine } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AIQuizGenerator } from './AIQuizGenerator';

interface Question {
  questionText: string;
  type: 'mcq' | 'short';
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface Quiz {
  _id: string;
  title: string;
  courseId: { _id: string; courseName: string; courseCode: string } | string;
  questions: Question[];
  timeLimit: number;
  totalMarks: number;
  isPublished: boolean;
  dueDate?: string;
  createdAt: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | null;
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
  semester?: string;
  department?: string;
}

const API = 'http://localhost:5000';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Hard:   'bg-red-100 text-red-700 border-red-200',
};

// ── Autocomplete Dropdown ─────────────────────────────────────────────────────
function AutocompleteDropdown({ options, value, onChange, placeholder, disabled }: {
  options: Course[]; value: string;
  onChange: (id: string, label: string) => void;
  placeholder: string; disabled?: boolean;
}) {
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const [display, setDisplay] = useState('');
  const wrapRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) { setDisplay(''); return; }
    const found = options.find(o => o._id === value);
    if (found) setDisplay(`${found.courseName} (${found.courseCode})`);
  }, [value, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (value) { const f = options.find(o => o._id === value); if (f) setDisplay(`${f.courseName} (${f.courseCode})`); }
        else setDisplay('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value, options]);

  const filtered = options.filter(o =>
    `${o.courseName} ${o.courseCode}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <input type="text" disabled={disabled}
          placeholder={disabled ? 'No courses assigned to you yet' : placeholder}
          value={open ? query : display}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm
            ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200' : 'bg-white border-gray-300'}
            ${value ? 'border-green-400' : ''}`}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button type="button" onClick={() => { setDisplay(''); setQuery(''); onChange('', ''); setOpen(false); }}
              className="text-gray-400 hover:text-red-500 p-0.5"><X className="w-3.5 h-3.5" /></button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <div className="px-3 py-3 text-sm text-gray-400 text-center">{options.length === 0 ? 'No courses assigned — contact admin' : 'No matches found'}</div>
            : filtered.map(course => (
              <button key={course._id} type="button"
                onMouseDown={() => { const l = `${course.courseName} (${course.courseCode})`; setDisplay(l); setQuery(''); setOpen(false); onChange(course._id, l); }}
                className={`w-full text-left px-3 py-2.5 hover:bg-green-50 text-sm transition-colors border-b border-gray-50 last:border-0 ${value === course._id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
              >
                <span className="font-medium">{course.courseName}</span>
                <span className="ml-2 text-xs text-gray-400">{course.courseCode}{course.semester ? ` · Sem ${course.semester}` : ''}{course.department ? ` · ${course.department}` : ''}</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Teacher Autocomplete (exported for admin quiz dashboard reuse) ─────────────
export function TeacherAutocompleteDropdown({ value, onChange, placeholder = 'Search faculty by name or email...', token }: {
  value: string; onChange: (id: string, name: string) => void; placeholder?: string; token?: string;
}) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen]       = useState(false);
  const [display, setDisplay] = useState('');
  const wrapRef               = useRef<HTMLDivElement>(null);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (!value) setDisplay(''); }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/teachers/search?q=${encodeURIComponent(q)}`, { headers });
      if (res.ok) { const data = await res.json(); setResults(data.data || []); }
    } catch { /* ignore */ }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input type="text" placeholder={placeholder} value={display || query}
        onFocus={() => { setOpen(true); search(query); }}
        onChange={e => { const v = e.target.value; setQuery(v); setDisplay(v); setOpen(true); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => search(v), 300); }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {results.map(t => (
            <button key={t._id} type="button"
              onMouseDown={() => { const l = `${t.name} (${t.email})`; setDisplay(l); setQuery(''); setOpen(false); onChange(t._id, l); }}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 text-sm border-b border-gray-50 last:border-0"
            >
              <span className="font-medium text-gray-800">{t.name}</span>
              <span className="ml-2 text-xs text-gray-400">{t.email} · {t.department}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FEATURE 1: Quiz Creation Mode Picker modal ────────────────────────────────
// Shown first when teacher clicks "Create Quiz"; lets them choose Manual vs AI
function QuizModePicker({ onSelectManual, onSelectAI, onClose }: {
  onSelectManual: () => void; onSelectAI: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Create Quiz</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-6 text-center">How would you like to create this quiz?</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Manual */}
            <button onClick={onSelectManual}
              className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <PenLine className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm">Create Manually</p>
                <p className="text-xs text-gray-500 mt-1">Write your own questions and answers</p>
              </div>
            </button>
            {/* AI */}
            <button onClick={onSelectAI}
              className="flex flex-col items-center gap-3 p-5 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-sm">Create using AI</p>
                <p className="text-xs text-gray-500 mt-1">Auto-generate with Gemini AI</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TeacherQuizManagement() {
  const { user } = useAuth();
  const [quizzes, setQuizzes]     = useState<Quiz[]>([]);
  const [courses, setCourses]     = useState<Course[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // FEATURE 1: modal flow: null → 'picker' → 'manual' | 'ai'
  const [modalMode, setModalMode] = useState<null | 'picker' | 'manual' | 'ai'>(null);

  // Manual form state
  const [title, setTitle]           = useState('');
  const [courseId, setCourseId]     = useState('');
  const [timeLimit, setTimeLimit]   = useState(30);
  const [dueDate, setDueDate]       = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
  const [questions, setQuestions]   = useState<Question[]>([
    { questionText: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', marks: 1 },
  ]);
  const [negEnabled, setNegEnabled] = useState(false);
  const [negMarks, setNegMarks]     = useState(0.25);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => { if (user?.id) fetchTeacherCourses(); }, [user]);

  const fetchTeacherCourses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const coursesRes = await fetch(`${API}/api/teachers/me/courses`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      let teacherCourses: Course[] = [];
      if (coursesRes.ok) {
        const d = await coursesRes.json();
        teacherCourses = d.data || [];
      } else if (user.assignedCourses?.length > 0) {
        const assignedIds = user.assignedCourses.map((c: any) => String(c.courseId || c._id));
        const allRes = await fetch(`${API}/api/courses`);
        if (allRes.ok) {
          const all: Course[] = await allRes.json();
          teacherCourses = all.filter(c => assignedIds.includes(String(c._id)));
        }
      }
      setCourses(teacherCourses);

      const allQuizzes: Quiz[] = [];
      for (const course of teacherCourses) {
        try {
          const qRes = await fetch(`${API}/api/quizzes/course/${course._id}`);
          if (qRes.ok) {
            const qs: Quiz[] = await qRes.json();
            qs.forEach(q => allQuizzes.push({ ...q, courseId: course }));
          }
        } catch { /* skip */ }
      }
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Failed to fetch teacher courses / quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion    = () => setQuestions([...questions, { questionText: '', type: 'mcq', options: ['','','',''], correctAnswer: '', marks: 1 }]);
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, field: keyof Question, value: any) => {
    const u = [...questions]; (u[i] as any)[field] = value; setQuestions(u);
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    const u = [...questions]; u[qi].options[oi] = value; setQuestions(u);
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim())                                return setError('Quiz title is required');
    if (!courseId)                                    return setError('Please select a course');
    if (questions.some(q => !q.questionText.trim()))  return setError('All questions must have text');
    if (questions.some(q => !q.correctAnswer.trim())) return setError('All questions must have a correct answer');

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, courseId, createdBy: user?.id, questions, timeLimit,
          dueDate: dueDate || undefined,
          difficulty: difficulty || null,
          negativeMarking: { enabled: negEnabled, marksPerQuestion: negMarks },
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Failed to create quiz');
      setModalMode(null);
      resetForm();
      fetchTeacherCourses();
    } catch { setError('Server error. Is backend running?'); }
    finally { setSaving(false); }
  };

  // FEATURE 4: publish sends quiz only to matching-bucket students
  // (backend's getQuizzesByCourse already filters by student bucket — publish just flips isPublished)
  const handlePublish = async (quizId: string) => {
    try {
      const res = await fetch(`${API}/api/quizzes/${quizId}/publish`, { method: 'PATCH' });
      if (res.ok) fetchTeacherCourses();
    } catch (err) { console.error('Failed to publish', err); }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Delete this quiz?')) return;
    setQuizzes(quizzes.filter(q => q._id !== quizId));
  };

  const resetForm = () => {
    setTitle(''); setCourseId(''); setTimeLimit(30); setDueDate('');
    setDifficulty(''); setError(''); setNegEnabled(false); setNegMarks(0.25);
    setQuestions([{ questionText: '', type: 'mcq', options: ['','','',''], correctAnswer: '', marks: 1 }]);
  };

  const filtered = quizzes.filter(q => {
    const cn = typeof q.courseId === 'object' ? q.courseId.courseName : '';
    return q.title.toLowerCase().includes(searchTerm.toLowerCase()) || cn.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const quizStars = (diff?: string | null) => {
    if (diff === 'Easy')   return { stars: '★☆☆☆☆', label: 'Beginner', color: 'text-amber-400' };
    if (diff === 'Medium') return { stars: '★★★☆☆', label: 'Medium',   color: 'text-amber-400' };
    if (diff === 'Hard')   return { stars: '★★★★★', label: 'Hard',     color: 'text-amber-500' };
    return null;
  };

  return (
    <div className="p-8">

      {/* FEATURE 1: Mode picker */}
      {modalMode === 'picker' && (
        <QuizModePicker
          onSelectManual={() => setModalMode('manual')}
          onSelectAI={() => setModalMode('ai')}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* AI Quiz Generator (FEATURE 2 bucket selection is inside AIQuizGenerator) */}
      {modalMode === 'ai' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl" style={{ height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AIQuizGenerator
              courses={courses}
              onClose={() => setModalMode(null)}
              onSaved={() => { setModalMode(null); fetchTeacherCourses(); }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Quiz Management</h2>
          <p className="text-gray-600">
            Create and manage quizzes for your assigned courses.
            {courses.length > 0 && (
              <span className="ml-2 text-green-600 font-medium">({courses.length} course{courses.length !== 1 ? 's' : ''} assigned)</span>
            )}
          </p>
        </div>
        {/* Single "Create Quiz" button — opens mode picker (FEATURE 1) */}
        <button
          onClick={() => setModalMode('picker')}
          disabled={courses.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" /> Create Quiz
        </button>
      </div>

      {!loading && courses.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">No courses assigned yet</p>
            <p className="text-sm text-yellow-700 mt-0.5">An admin needs to assign courses to your account before you can create quizzes. If you believe courses have been assigned, try logging out and back in.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Total Quizzes', value: quizzes.length,                            icon: Shield, color: 'green'  },
          { label: 'Published',     value: quizzes.filter(q => q.isPublished).length, icon: Send,   color: 'blue'   },
          { label: 'My Courses',    value: courses.length,                             icon: Users,  color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading your quizzes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{courses.length === 0 ? 'No courses assigned. Contact an admin.' : 'No quizzes yet. Create your first quiz!'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(quiz => {
            const course = typeof quiz.courseId === 'object' ? quiz.courseId : null;
            return (
              <div key={quiz._id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{quiz.title}</h3>
                      {quiz.difficulty && (() => {
                        const s = quizStars(quiz.difficulty);
                        return s ? <span className={`text-sm font-medium ${s.color}`} title={`${s.label} level`}>{s.stars}</span> : null;
                      })()}
                      {quiz.difficulty && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[quiz.difficulty]}`}>{quiz.difficulty}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {course && <p className="text-sm text-gray-500 mb-2">{course.courseName} ({course.courseCode})</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.timeLimit} min</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />{quiz.totalMarks} marks</span>
                      <span>{quiz.questions?.length || 0} questions</span>
                      {quiz.dueDate && <span>Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>}
                      {/* FEATURE 4: show which bucket receives this quiz */}
                      {quiz.difficulty
                        ? <span className={`font-medium px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[quiz.difficulty]}`}>→ {quiz.difficulty} students only</span>
                        : <span className="text-gray-400">→ All students</span>
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!quiz.isPublished && (
                      <button onClick={() => handlePublish(quiz._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                      ><Send className="w-3 h-3" /> Publish</button>
                    )}
                    <button onClick={() => handleDelete(quiz._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual Create Quiz Modal ─────────────────────────────────────────── */}
      {modalMode === 'manual' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="w-5 h-5 text-white" />
                <h3 className="text-xl font-bold text-white">Create Quiz Manually</h3>
              </div>
              <button onClick={() => { setModalMode(null); resetForm(); }} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Calculus Integration Quiz"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *{courses.length > 0 && <span className="ml-2 text-xs text-green-600 font-normal">{courses.length} course{courses.length !== 1 ? 's' : ''} available</span>}
                  </label>
                  <AutocompleteDropdown options={courses} value={courseId} onChange={id => setCourseId(id)}
                    placeholder="Search your assigned courses..." disabled={courses.length === 0}
                  />
                  {courses.length === 0 && <p className="text-xs text-red-500 mt-1">No courses are assigned to your account. Please contact the admin.</p>}
                </div>

                {/* FEATURE 2 & 4: bucket targeting — select which bucket gets this quiz */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Bucket</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Students (no filter)</option>
                    <option value="Easy">🟢 Easy — only Easy-bucket students</option>
                    <option value="Medium">🟡 Medium — only Medium-bucket students</option>
                    <option value="Hard">🔴 Hard — only Hard-bucket students</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Published quiz visible only to students in selected bucket.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                  <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min={5} max={180}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                  <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h4>
                  <button onClick={addQuestion} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100">
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>
                <div className="space-y-6">
                  {questions.map((q, qi) => (
                    <div key={qi} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Q{qi + 1}</span>
                        {questions.length > 1 && <button onClick={() => removeQuestion(qi)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>}
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Question text *" value={q.questionText}
                          onChange={e => updateQuestion(qi, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            ><option value="mcq">MCQ</option><option value="short">Short Answer</option></select>
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-500 mb-1">Marks</label>
                            <input type="number" value={q.marks} onChange={e => updateQuestion(qi, 'marks', Number(e.target.value))} min={1}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            />
                          </div>
                        </div>
                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <input key={oi} type="text" placeholder={`Option ${oi + 1}`} value={opt}
                                onChange={e => updateOption(qi, oi, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                              />
                            ))}
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Correct Answer *{q.type === 'mcq' ? ' (must match one option exactly)' : ''}</label>
                          {q.type === 'mcq' ? (
                            <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            >
                              <option value="">Select correct answer...</option>
                              {q.options.filter(o => o.trim()).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input type="text" placeholder="Expected answer" value={q.correctAnswer}
                              onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Marking */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Negative Marking</p>
                    <p className="text-xs text-gray-500">Deduct marks for wrong answers</p>
                  </div>
                  <button type="button" onClick={() => setNegEnabled(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${negEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
                  ><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${negEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
                {negEnabled && (
                  <div className="flex items-center gap-3 mt-2">
                    <label className="text-sm text-gray-700 whitespace-nowrap">Marks deducted per wrong answer:</label>
                    <input type="number" min={0.25} step={0.25} value={negMarks}
                      onChange={e => setNegMarks(Math.max(0.25, Number(e.target.value)))}
                      className="w-24 px-3 py-1.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-semibold text-red-700"
                    />
                    <span className="text-xs text-gray-500">(skipped questions not penalised)</span>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
                Total Marks: <strong>{questions.reduce((s, q) => s + q.marks, 0)}</strong> |
                Questions: <strong>{questions.length}</strong> |
                Time Limit: <strong>{timeLimit} min</strong>
                {difficulty && <> | Target Bucket: <strong>{difficulty}</strong></>}
                {negEnabled && <> | <span className="text-red-700 font-semibold">–{negMarks} per wrong answer</span></>}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => { setModalMode(null); resetForm(); }}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !courseId || !title.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Clock, Users, Shield, Award, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
}

interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
}

const API = 'http://localhost:5000';

export function TeacherQuizManagement() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { questionText: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', marks: 1 }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // Get all courses first, then get quizzes for each
      const res = await fetch(`${API}/api/courses`);
      const coursesData = await res.json();
      const allQuizzes: Quiz[] = [];
      for (const course of coursesData) {
        const qRes = await fetch(`${API}/api/quizzes/course/${course._id}`);
        if (qRes.ok) {
          const qs = await qRes.json();
          qs.forEach((q: Quiz) => allQuizzes.push({ ...q, courseId: course }));
        }
      }
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API}/api/courses`);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: '', type: 'mcq',
      options: ['', '', '', ''], correctAnswer: '', marks: 1
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) return setError('Quiz title is required');
    if (!courseId) return setError('Please select a course');
    if (questions.some(q => !q.questionText.trim())) return setError('All questions must have text');
    if (questions.some(q => !q.correctAnswer.trim())) return setError('All questions must have a correct answer');

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, courseId, createdBy: user?.id,
          questions, timeLimit, dueDate: dueDate || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Failed to create quiz');

      setShowCreateModal(false);
      resetForm();
      fetchQuizzes();
    } catch (err) {
      setError('Server error. Is backend running?');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (quizId: string) => {
    try {
      const res = await fetch(`${API}/api/quizzes/${quizId}/publish`, { method: 'PATCH' });
      if (res.ok) fetchQuizzes();
    } catch (err) {
      console.error('Failed to publish', err);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Delete this quiz?')) return;
    // Add delete route later; for now just remove from UI
    setQuizzes(quizzes.filter(q => q._id !== quizId));
  };

  const resetForm = () => {
    setTitle(''); setCourseId(''); setTimeLimit(30); setDueDate(''); setError('');
    setQuestions([{ questionText: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', marks: 1 }]);
  };

  const filtered = quizzes.filter(q => {
    const courseName = typeof q.courseId === 'object' ? q.courseId.courseName : '';
    return q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           courseName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Quiz Management</h2>
          <p className="text-gray-600">Create and manage quizzes for your courses.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" /> Create Quiz
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Total Quizzes', value: quizzes.length, icon: Shield, color: 'green' },
          { label: 'Published', value: quizzes.filter(q => q.isPublished).length, icon: Send, color: 'blue' },
          { label: 'Total Attempts', value: 0, icon: Users, color: 'purple' },
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading quizzes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No quizzes found. Click "Create Quiz" to add one.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(quiz => {
            const course = typeof quiz.courseId === 'object' ? quiz.courseId : null;
            return (
              <div key={quiz._id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        quiz.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {course ? `${course.courseName} (${course.courseCode})` : 'Unknown Course'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" /> {quiz.questions.length} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {quiz.timeLimit} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-4 h-4" /> {quiz.totalMarks} Marks
                      </span>
                      {quiz.dueDate && (
                        <span className="text-orange-600">
                          Due: {new Date(quiz.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!quiz.isPublished && (
                      <button
                        onClick={() => handlePublish(quiz._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <Send className="w-4 h-4" /> Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(quiz._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create New Quiz</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="text-white/80 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Quiz Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Calculus Integration Quiz"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={e => setTimeLimit(Number(e.target.value))}
                    min={5} max={180}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Questions ({questions.length})
                  </h4>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qi) => (
                    <div key={qi} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Q{qi + 1}</span>
                        {questions.length > 1 && (
                          <button onClick={() => removeQuestion(qi)}
                            className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Question text *"
                          value={q.questionText}
                          onChange={e => updateQuestion(qi, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />

                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select
                              value={q.type}
                              onChange={e => updateQuestion(qi, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            >
                              <option value="mcq">MCQ</option>
                              <option value="short">Short Answer</option>
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-500 mb-1">Marks</label>
                            <input
                              type="number"
                              value={q.marks}
                              onChange={e => updateQuestion(qi, 'marks', Number(e.target.value))}
                              min={1}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            />
                          </div>
                        </div>

                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <input
                                key={oi}
                                type="text"
                                placeholder={`Option ${oi + 1}`}
                                value={opt}
                                onChange={e => updateOption(qi, oi, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                              />
                            ))}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Correct Answer * {q.type === 'mcq' ? '(must match one option exactly)' : ''}
                          </label>
                          {q.type === 'mcq' ? (
                            <select
                              value={q.correctAnswer}
                              onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}
                              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                            >
                              <option value="">Select correct answer...</option>
                              {q.options.filter(o => o.trim()).map((opt, oi) => (
                                <option key={oi} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Expected answer"
                              value={q.correctAnswer}
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

              {/* Total marks preview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
                Total Marks: <strong>{questions.reduce((s, q) => s + q.marks, 0)}</strong> |
                Questions: <strong>{questions.length}</strong> |
                Time Limit: <strong>{timeLimit} min</strong>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
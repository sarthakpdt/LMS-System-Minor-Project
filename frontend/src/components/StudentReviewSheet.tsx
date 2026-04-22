import { useState } from 'react';
import { Eye, Download, Copy, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const API = 'http://localhost:5000/api';

interface SubmissionAnswer {
  questionId: string;
  studentAnswer: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  fileUrl?: string;
  aiFeedback?: string;
}

interface Question {
  _id: string;
  questionText: string;
  type: 'mcq' | 'short' | 'long';
  correctAnswer: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Submission {
  _id: string;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  answers: SubmissionAnswer[];
  teacherComment: string;
  teacherScore?: number | null;
  overallFeedback: string;
  strengths: string[];
  improvementAreas: string[];
  submittedAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  questions: Question[];
  courseId: any;
  totalMarks: number;
}

export function StudentReviewSheet({
  assignment,
  submission,
  onClose,
}: {
  assignment: Assignment;
  submission: Submission;
  onClose: () => void;
}) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Safety guards — ensure arrays are always defined
  const questions: Question[] = Array.isArray(assignment?.questions) ? assignment.questions : [];
  const answers: SubmissionAnswer[] = Array.isArray(submission?.answers) ? submission.answers : [];
  const strengths: string[] = Array.isArray(submission?.strengths) ? submission.strengths : [];
  const improvementAreas: string[] = Array.isArray(submission?.improvementAreas) ? submission.improvementAreas : [];
  const percentage = submission?.percentage ?? 0;

  // Early return if critical data missing
  if (!assignment || !submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
          <p className="text-yellow-800 font-medium">Review data not available.</p>
          <button onClick={onClose} className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const getAIInsight = async (questionId: string) => {
    const q = questions.find(qq => qq._id === questionId);
    const ans = answers.find(a => a.questionId === questionId);
    if (!q || !ans) return;

    setAiLoading(questionId);
    try {
      const prompt = `Student answered this question incorrectly or partially:\n\nQuestion: "${q.questionText}"\nQuestion Type: ${q.type}\nDifficulty: ${q.difficulty}\nStudent's Answer: "${ans.studentAnswer || 'No answer provided'}"\nExpected Answer: "${q.correctAnswer}"\nMarks Awarded: ${ans.marksAwarded}/${q.marks}\n\nProvide 2-3 focused, actionable study tips to help this student understand and improve on similar questions.`;

      const res = await fetch(`${API}/assignments/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      if (data.success && data.response) {
        setAiFeedback(prev => ({ ...prev, [questionId]: data.response }));
      }
    } catch (err) {
      console.error('Failed to get AI insight:', err);
    } finally {
      setAiLoading(null);
    }
  };

  const copyToClipboard = () => {
    let text = `Review of "${assignment.title}"\n\n`;
    text += `Score: ${submission.totalScore}/${submission.totalMarks} (${percentage.toFixed(1)}%)\n`;
    text += `Grade: ${submission.grade}\n\n`;
    
    answers.forEach((ans, idx) => {
      const q = questions.find(qq => qq._id === ans.questionId);
      if (q) {
        text += `Q${idx + 1}: ${q.questionText}\n`;
        text += `Your Answer: ${ans.studentAnswer || 'Not answered'}\n`;
        text += `Marks: ${ans.marksAwarded}/${q.marks} (${ans.isCorrect ? 'Correct' : 'Incorrect'})\n\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const DIFF_COLORS: Record<string, string> = {
    easy:   'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard:   'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Reviewed Answer Sheet</h2>
          <p className="text-sm text-gray-500 mt-1">Review your submission and teacher's feedback</p>
        </div>
        <button onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          ← Back
        </button>
      </div>

      {/* ── Score Summary ── */}
      <div className={`rounded-2xl p-8 text-white text-center mb-6 shadow-lg ${
        percentage >= 80 ? 'bg-gradient-to-br from-green-500 to-green-700' :
        percentage >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                          'bg-gradient-to-br from-red-500 to-red-700'
      }`}>
        <div className="text-5xl mb-3">
          {percentage >= 80 ? '🏆' : percentage >= 60 ? '✅' : '📚'}
        </div>
        <h3 className="text-xl font-bold mb-2">{assignment.title}</h3>
        <div className="text-5xl font-black my-3">{percentage.toFixed(1)}%</div>
        <p className="text-lg">{submission.totalScore} / {submission.totalMarks} marks · Grade: <strong>{submission.grade}</strong></p>
      </div>

      {/* ── AI Feedback ── */}
      {submission.overallFeedback && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> AI Analysis &amp; Feedback
          </h3>
          <p className="text-sm text-gray-700 mb-4">{submission.overallFeedback}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strengths.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm font-bold text-green-700 mb-2">✅ Your Strengths</p>
                <ul className="space-y-1">
                  {strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {improvementAreas.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="text-sm font-bold text-orange-700 mb-2">📈 Areas to Improve</p>
                <ul className="space-y-1">
                  {improvementAreas.map((a, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1 flex-shrink-0">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Teacher Comment ── */}
      {submission.teacherComment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" /> Teacher's Review
          </h3>
          <p className="text-sm text-gray-700">{submission.teacherComment}</p>
          {submission.teacherScore !== null && submission.teacherScore !== undefined && submission.teacherScore !== submission.totalScore && (
            <p className="text-sm text-blue-700 mt-2 font-semibold">
              ✏️ Score Adjusted by Teacher: {submission.teacherScore} / {submission.totalMarks} marks
            </p>
          )}
        </div>
      )}

      {/* ── Detailed Answer Review ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Detailed Question Review</h3>
          <button onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition">
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        </div>

        {answers.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 text-gray-400">
            <p className="text-sm">No detailed answer data available for this submission.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((ans, idx) => {
              const q = questions.find(qq => qq._id === ans.questionId);
              if (!q) return (
                <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Q{idx + 1}: Question details not available</p>
                  <p className="text-sm text-gray-700 mt-1">Your Answer: {ans.studentAnswer || 'Not answered'}</p>
                  <p className="text-xs text-gray-500">Marks: {ans.marksAwarded ?? 0}</p>
                </div>
              );
              
              const isOpen = expandedQ === q._id;
              const hasAIFeedback = aiFeedback[q._id];

              return (
                <div key={q._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* ── Question Header ── */}
                  <button
                    onClick={() => setExpandedQ(isOpen ? null : q._id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-bold text-gray-900 text-sm">Q{idx + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                          {q.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                          ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {ans.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {ans.marksAwarded ?? 0}/{q.marks} marks
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{q.questionText}</p>
                    </div>
                    {isOpen ? (
                      <Eye className="w-5 h-5 text-indigo-600 ml-2 flex-shrink-0" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                      {/* ── Your Answer ── */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-2">Your Answer:</p>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-700 font-mono">
                          {ans.studentAnswer || <span className="text-gray-400 italic">No answer provided</span>}
                        </div>
                        {ans.fileUrl && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-600 mb-1">📎 Attached File:</p>
                            <a href={`${API}${ans.fileUrl}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100">
                              <Download className="w-3 h-3" /> View File
                            </a>
                          </div>
                        )}
                      </div>

                      {/* ── Expected Answer ── */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-2">Expected/Correct Answer:</p>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-sm text-gray-700 font-mono">
                          {q.correctAnswer || <span className="text-gray-400 italic">Answer key not provided by teacher</span>}
                        </div>
                      </div>

                      {/* ── Comparison ── */}
                      <div className={`rounded-lg p-3 border ${
                        ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                      }`}>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          {ans.isCorrect ? (
                            <><CheckCircle className="w-4 h-4 text-green-600" /> Correct Answer</>
                          ) : (
                            <><AlertCircle className="w-4 h-4 text-orange-600" /> Needs Improvement</>
                          )}
                        </p>
                        <p className="text-xs text-gray-700">
                          {ans.isCorrect ? '✅ Great job! You answered correctly.' : '📝 Your answer was partially or completely incorrect. Review the expected answer above.'}
                        </p>
                      </div>

                      {/* ── AI Study Tips ── */}
                      <div>
                        <button onClick={() => getAIInsight(q._id)}
                          disabled={aiLoading === q._id}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition disabled:opacity-50">
                          {aiLoading === q._id ? (
                            <><span className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                          ) : (
                            <><Sparkles className="w-4 h-4" /> AI Study Tips</>
                          )}
                        </button>
                        {hasAIFeedback && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-200 text-sm text-gray-700 space-y-1">
                            <p className="text-xs font-bold text-indigo-700 mb-1">💡 Personalized Tips:</p>
                            {aiFeedback[q._id].split('\n').map((tip, i) => (
                              tip.trim() && (
                                <p key={i} className="flex items-start gap-2">
                                  <span className="text-indigo-600 mt-0.5 flex-shrink-0">•</span>
                                  <span>{tip}</span>
                                </p>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Action Footer ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-600">
          📊 Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('en-IN') : '—'}
        </div>
        <button onClick={onClose}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition">
          ← Back to Assignments
        </button>
      </div>
    </div>
  );
}

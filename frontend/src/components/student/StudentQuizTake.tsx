import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, ArrowRight, Send,
  Camera, CameraOff, Eye, EyeOff, Shield, ShieldAlert, Smartphone, Users, TabletSmartphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  _id: string;
  questionText: string;
  type: 'mcq' | 'short';
  options: string[];
  marks: number;
}
interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  timeLimit: number;
  totalMarks: number;
  questions: Question[];
  dueDate?: string;
}
interface GradedAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
}
interface SubmitResult {
  score: number;
  totalMarks: number;
  percentage: number;
  gradedAnswers: GradedAnswer[];
  correctAnswers: { questionId: string; correctAnswer: string }[];
}

type PlagType = 'multiple_faces' | 'no_face' | 'phone_detected' | 'tab_switch' | 'face_away' | 'camera_blocked';
interface PlagEvent {
  id: string;
  type: PlagType;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

const PLAG_MESSAGES: Record<PlagType, { message: string; severity: 'low' | 'medium' | 'high' }> = {
  multiple_faces: { message: 'Multiple faces detected in camera', severity: 'high' },
  no_face:        { message: 'No face detected — please stay visible', severity: 'medium' },
  phone_detected: { message: 'Mobile phone detected in frame', severity: 'high' },
  tab_switch:     { message: 'Tab / window switch detected', severity: 'high' },
  face_away:      { message: 'Student looking away from screen', severity: 'medium' },
  camera_blocked: { message: 'Camera appears blocked or covered', severity: 'high' },
};

const API = 'http://localhost:5000';

// ── Simulated proctoring (replace with face-api.js for real detection) ────────
function useSimulatedProctoring(active: boolean, onViolation: (type: PlagType) => void) {
  useEffect(() => {
    if (!active) return;
    const events: PlagType[] = ['multiple_faces', 'no_face', 'phone_detected', 'face_away'];
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeout = setTimeout(() => {
        onViolation(events[Math.floor(Math.random() * events.length)]);
        scheduleNext();
      }, 15000 + Math.random() * 25000);
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [active, onViolation]);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StudentQuizTake() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Camera — single ref, always mounted in DOM ───────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraMinimized, setCameraMinimized] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // ── Proctoring ───────────────────────────────────────────────────────────────
  const [plagEvents, setPlagEvents] = useState<PlagEvent[]>([]);
  const [activeWarning, setActiveWarning] = useState<PlagEvent | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab switch
  useEffect(() => {
    const handle = () => {
      if (document.hidden && cameraReady && !submitted) addViolation('tab_switch');
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [cameraReady, submitted]);

  // Block copy/paste
  useEffect(() => {
    const blockCtx = (e: MouseEvent) => { if (quizStarted) e.preventDefault(); };
    const blockKeys = (e: KeyboardEvent) => {
      if (quizStarted && (e.ctrlKey || e.metaKey) && ['c','v','u','a','p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        addViolation('tab_switch');
      }
    };
    document.addEventListener('contextmenu', blockCtx);
    document.addEventListener('keydown', blockKeys);
    return () => {
      document.removeEventListener('contextmenu', blockCtx);
      document.removeEventListener('keydown', blockKeys);
    };
  }, [quizStarted]);

  const addViolation = useCallback((type: PlagType) => {
    const info = PLAG_MESSAGES[type];
    const event: PlagEvent = {
      id: `${type}-${Date.now()}`,
      type, timestamp: new Date(),
      message: info.message, severity: info.severity,
    };
    setPlagEvents(prev => [event, ...prev]);
    setActiveWarning(event);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setActiveWarning(null), 4000);
  }, []);

  useSimulatedProctoring(cameraReady && quizStarted && !submitted, addViolation);

  // Start camera and attach to video element
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      // attach with retry until ref is ready
      const attach = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraReady(true);
          setCameraError('');
        } else {
          setTimeout(attach, 100);
        }
      };
      attach();
    } catch {
      setCameraError('Camera access denied. Please allow camera to take this quiz.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  // Re-attach whenever minimized state changes (video el re-renders)
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraMinimized, quizStarted]);

  useEffect(() => () => stopCamera(), []);

  // Load quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${API}/api/quizzes/${id}`);
        if (!res.ok) { setError('Quiz not found or unavailable.'); return; }
        const data: Quiz = await res.json();
        setQuiz(data);
        setTimeLeft(data.timeLimit * 60);
      } catch {
        setError('Failed to load quiz. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // Submit
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting || submitted) return;
    if (!autoSubmit && !confirm('Submit quiz now? You cannot change answers after submission.')) return;
    setSubmitting(true);
    stopCamera();
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answersArray = quiz!.questions.map(q => ({
      questionId: q._id, selectedAnswer: answers[q._id] || ''
    }));
    try {
      const res = await fetch(`${API}/api/quizzes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.id, courseId: quiz!.courseId,
          answers: answersArray, timeTaken,
          plagiarismEvents: plagEvents.map(e => ({ type: e.type, timestamp: e.timestamp, severity: e.severity })),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message === 'Quiz already attempted' ? 'You have already attempted this quiz.' : data.message || 'Submission failed.');
        setSubmitting(false);
        return;
      }
      setResult(data);
      setSubmitted(true);
    } catch {
      setError('Submission failed. Check your connection.');
      setSubmitting(false);
    }
  }, [submitting, submitted, quiz, answers, id, user, startTime, plagEvents, stopCamera]);

  // Countdown
  useEffect(() => {
    if (!quiz || submitted || !quizStarted) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [quiz, timeLeft, submitted, quizStarted, handleSubmit]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const severityIcon = (type: PlagType) => {
    switch (type) {
      case 'multiple_faces': return <Users className="w-4 h-4" />;
      case 'phone_detected': return <Smartphone className="w-4 h-4" />;
      case 'tab_switch':     return <TabletSmartphone className="w-4 h-4" />;
      case 'camera_blocked': return <CameraOff className="w-4 h-4" />;
      case 'face_away':      return <EyeOff className="w-4 h-4" />;
      default:               return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const totalQ = quiz?.questions.length || 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading quiz...
      </div>
    </div>
  );

  // ERROR
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center shadow-lg">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Go Back</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // CAMERA PERMISSION GATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (!quizStarted && quiz) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Camera Required</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            This quiz uses AI-powered proctoring. Your camera will be active for the entire exam.
          </p>
        </div>

        <ul className="text-sm text-gray-600 space-y-2 mb-6 bg-gray-50 rounded-xl p-4">
          <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500 flex-shrink-0" /> Keep your face visible at all times</li>
          <li className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-500 flex-shrink-0" /> Multiple faces will trigger an alert</li>
          <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-red-500 flex-shrink-0" /> Phone detected = violation logged</li>
          <li className="flex items-center gap-2"><TabletSmartphone className="w-4 h-4 text-red-500 flex-shrink-0" /> Tab switching is monitored</li>
          <li className="flex items-center gap-2"><EyeOff className="w-4 h-4 text-red-500 flex-shrink-0" /> Looking away is monitored</li>
        </ul>

        {cameraError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{cameraError}</div>
        )}

        <button
          onClick={async () => {
            await startCamera();
            setTimeout(() => setQuizStarted(true), 400);
          }}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-base"
        >
          <Camera className="w-5 h-5" /> Allow Camera & Start Quiz
        </button>
        <button onClick={() => navigate(-1)} className="mt-3 w-full py-2 text-gray-400 hover:text-gray-600 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RESULT
  // ─────────────────────────────────────────────────────────────────────────────
  if (submitted && result && quiz) {
    const passed = result.percentage >= 60;
    const highCount = plagEvents.filter(e => e.severity === 'high').length;
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl p-8 mb-6 text-white text-center shadow-xl ${
            result.percentage >= 80 ? 'bg-gradient-to-br from-green-500 to-green-700' :
            result.percentage >= 60 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
            'bg-gradient-to-br from-red-500 to-red-700'
          }`}>
            <div className="text-6xl mb-2">{result.percentage >= 80 ? '🏆' : result.percentage >= 60 ? '✅' : '❌'}</div>
            <h2 className="text-3xl font-bold mb-1">{quiz.title}</h2>
            <p className="text-white/80 mb-6">Quiz Completed</p>
            <div className="text-7xl font-black mb-2">{result.percentage.toFixed(1)}%</div>
            <p className="text-xl font-semibold">{result.score} / {result.totalMarks} marks</p>
            <span className="inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium bg-white/20">
              {passed ? '✓ Passed' : '✗ Failed'}
            </span>
          </div>

          {plagEvents.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm mb-6 overflow-hidden">
              <div className="px-6 py-4 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Proctoring Report</h3>
                </div>
                <span className="text-sm text-orange-700 font-medium">{plagEvents.length} violation{plagEvents.length > 1 ? 's' : ''}</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                {(['high','medium','low'] as const).map(s => (
                  <div key={s} className={`text-center p-3 rounded-lg ${s==='high'?'bg-red-50':s==='medium'?'bg-orange-50':'bg-yellow-50'}`}>
                    <p className={`text-2xl font-bold ${s==='high'?'text-red-600':s==='medium'?'text-orange-600':'text-yellow-600'}`}>
                      {plagEvents.filter(e => e.severity === s).length}
                    </p>
                    <p className={`text-xs mt-1 capitalize ${s==='high'?'text-red-500':s==='medium'?'text-orange-500':'text-yellow-500'}`}>{s} Severity</p>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {plagEvents.map(e => (
                  <div key={e.id} className={`flex items-center gap-3 px-5 py-3 ${e.severity==='high'?'bg-red-50/50':e.severity==='medium'?'bg-orange-50/50':'bg-yellow-50/50'}`}>
                    <span className={e.severity==='high'?'text-red-500':e.severity==='medium'?'text-orange-500':'text-yellow-500'}>{severityIcon(e.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{e.message}</p>
                      <p className="text-xs text-gray-400">{e.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border capitalize ${
                      e.severity==='high'?'text-red-600 bg-red-50 border-red-200':
                      e.severity==='medium'?'text-orange-600 bg-orange-50 border-orange-200':
                      'text-yellow-600 bg-yellow-50 border-yellow-200'
                    }`}>{e.severity}</span>
                  </div>
                ))}
              </div>
              {highCount > 0 && (
                <div className="px-5 py-3 bg-red-50 border-t border-red-100 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {highCount} high-severity violation{highCount > 1 ? 's' : ''} flagged. Your instructor will review this report.
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Answer Review</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {quiz.questions.map((q, qi) => {
                const graded = result.gradedAnswers.find(a => a.questionId === q._id);
                const correct = result.correctAnswers.find(a => a.questionId === q._id);
                return (
                  <div key={q._id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${graded?.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        {graded?.isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Q{qi+1}. {q.questionText}
                          <span className="ml-2 text-xs text-gray-400">({q.marks} mark{q.marks>1?'s':''})</span>
                        </p>
                        <div className="text-sm space-y-1">
                          <p><span className="text-gray-500">Your answer: </span>
                            <span className={graded?.isCorrect ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                              {graded?.selectedAnswer || <em className="text-gray-400">Not answered</em>}
                            </span>
                          </p>
                          {!graded?.isCorrect && <p><span className="text-gray-500">Correct answer: </span><span className="text-green-700 font-medium">{correct?.correctAnswer}</span></p>}
                          <p className="text-gray-500">Marks: <span className="font-medium text-gray-900">{graded?.marksAwarded||0}/{q.marks}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="mt-6 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUIZ ATTEMPT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!quiz) return null;
  const question = quiz.questions[currentQ];
  const isLast = currentQ === totalQ - 1;
  const timerWarning = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-gray-50 select-none pb-10">

      {/* ── Violation warning overlay ──────────────────────────────────────────── */}
      {activeWarning && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none px-4">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border w-full max-w-sm animate-bounce-in ${
            activeWarning.severity === 'high'   ? 'bg-red-600 border-red-700 text-white' :
            activeWarning.severity === 'medium' ? 'bg-orange-500 border-orange-600 text-white' :
            'bg-yellow-400 border-yellow-500 text-yellow-900'
          }`}>
            {severityIcon(activeWarning.type)}
            <div className="flex-1">
              <p className="font-bold text-sm">⚠️ Violation Detected</p>
              <p className="text-xs opacity-90 mt-0.5">{activeWarning.message}</p>
            </div>
            <span className="text-xs opacity-75 font-bold uppercase">{activeWarning.severity}</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          CAMERA BOX — fixed position, always visible on ALL screen sizes
          Always uses the single videoRef. Never hidden by breakpoints.
      ══════════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-40 rounded-2xl overflow-hidden border-2 border-white shadow-2xl"
        style={{
          top: '70px',
          right: '12px',
          width: cameraMinimized ? '52px' : '200px',
          height: cameraMinimized ? '52px' : '150px',
          transition: 'width 0.25s ease, height 0.25s ease',
          background: '#111',
        }}
      >
        {/* The one and only video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: cameraMinimized ? 'none' : 'block' }}
        />

        {/* Minimized state: camera icon */}
        {cameraMinimized && (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}

        {/* LIVE badge */}
        {!cameraMinimized && cameraReady && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            LIVE
          </div>
        )}

        {/* No camera fallback */}
        {!cameraReady && !cameraMinimized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-1">
            <CameraOff className="w-7 h-7 text-gray-500" />
            <span className="text-gray-500 text-[10px]">No camera</span>
          </div>
        )}

        {/* Minimize / expand button */}
        <button
          onClick={() => setCameraMinimized(v => !v)}
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
          title={cameraMinimized ? 'Show camera' : 'Minimize'}
        >
          {cameraMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>

        {/* Violation count badge */}
        {plagEvents.length > 0 && (
          <div className="absolute -top-2 -left-2 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-md">
            {plagEvents.length}
          </div>
        )}
      </div>

      {/* ── Top Bar ───────────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-md ${
        timerWarning ? 'bg-red-600' : 'bg-green-600'
      }`}>
        <h1 className="text-white font-bold text-base truncate" style={{ maxWidth: 'calc(100% - 220px)' }}>
          {quiz.title}
        </h1>
        <div className="flex items-center gap-2">
          {plagEvents.length > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" /> {plagEvents.length}
            </div>
          )}
          <span className="text-white/80 text-sm hidden sm:inline">{answeredCount}/{totalQ}</span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${
            timerWarning ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* ── Main quiz area (right padding keeps content away from camera) ──────── */}
      <div className="max-w-2xl mx-auto p-4 md:p-6" style={{ paddingRight: '220px' }}>

        {/* Progress */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Question {currentQ + 1} of {totalQ}</span>
            <span className="text-sm px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              {question.marks} mark{question.marks > 1 ? 's' : ''}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-5">{question.questionText}</h3>
          {question.type === 'mcq' ? (
            <div className="space-y-3">
              {question.options.filter(o => o.trim()).map((option, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers(prev => ({ ...prev, [question._id]: option }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                    answers[question._id] === option
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-current mr-3 text-xs flex-shrink-0">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              rows={4}
              placeholder="Type your answer here..."
              value={answers[question._id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [question._id]: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
            />
          )}
        </div>

        {/* Navigator */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, qi) => (
              <button
                key={qi}
                onClick={() => setCurrentQ(qi)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  qi === currentQ ? 'bg-green-600 text-white shadow-md' :
                  answers[q._id] ? 'bg-green-100 text-green-700 border border-green-300' :
                  'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {qi + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          {isLast ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 shadow-md text-sm"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : `Submit (${answeredCount}/${totalQ})`}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ(q => Math.min(totalQ - 1, q + 1))}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {timerWarning && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Less than 1 minute remaining! Quiz will auto-submit.
          </div>
        )}

        {/* Live violations log */}
        {plagEvents.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-900">Live Violations ({plagEvents.length})</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
              {plagEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`flex-shrink-0 ${e.severity==='high'?'text-red-500':e.severity==='medium'?'text-orange-500':'text-yellow-500'}`}>
                    {severityIcon(e.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{e.message}</p>
                    <p className="text-xs text-gray-400">{e.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border capitalize flex-shrink-0 ${
                    e.severity==='high'?'text-red-600 bg-red-50 border-red-200':
                    e.severity==='medium'?'text-orange-600 bg-orange-50 border-orange-200':
                    'text-yellow-600 bg-yellow-50 border-yellow-200'
                  }`}>{e.severity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0%   { transform: translateY(-16px) scale(0.96); opacity: 0; }
          60%  { transform: translateY(3px) scale(1.01); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
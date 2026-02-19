import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Camera, AlertTriangle, Clock, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';

const mockQuestions = [
  {
    id: 1,
    question: 'What is Newton\'s First Law of Motion?',
    type: 'multiple-choice',
    options: [
      'An object at rest stays at rest unless acted upon by an external force',
      'Force equals mass times acceleration',
      'For every action there is an equal and opposite reaction',
      'Energy cannot be created or destroyed'
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Calculate the force required to accelerate a 10kg object at 5 m/s². (F = ma)',
    type: 'multiple-choice',
    options: [
      '50 N',
      '15 N',
      '2 N',
      '100 N'
    ],
    correctAnswer: 0
  },
  // Add more questions as needed
];

export function StudentQuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [webcamActive, setWebcamActive] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted]);

  // Tab switching detection
  useEffect(() => {
    if (!quizStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quizStarted]);

  // Prevent copy-paste
  useEffect(() => {
    if (!quizStarted) return;

    const preventCopy = (e: Event) => e.preventDefault();
    const preventPaste = (e: Event) => e.preventDefault();
    
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCopy);
    
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCopy);
    };
  }, [quizStarted]);

  const handleAutoSubmit = () => {
    alert('Time is up! Your quiz has been automatically submitted.');
    navigate('/quizzes');
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(false);
    alert(`Quiz submitted successfully!\n\nAnswered: ${Object.keys(answers).length}/${mockQuestions.length} questions\nTab switches detected: ${tabSwitchCount}`);
    navigate('/quizzes');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / mockQuestions.length) * 100;

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz: Newton's Laws</h2>
            <p className="text-gray-600">Physics 202</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quiz Details:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Questions:</p>
                  <p className="font-medium text-gray-900">15</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration:</p>
                  <p className="font-medium text-gray-900">30 minutes</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Marks:</p>
                  <p className="font-medium text-gray-900">75</p>
                </div>
                <div>
                  <p className="text-gray-600">Passing Score:</p>
                  <p className="font-medium text-gray-900">45 (60%)</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Anti-Cheating Measures Active:
              </h3>
              <ul className="text-sm text-red-800 space-y-2">
                <li className="flex items-start gap-2">
                  <Camera className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Webcam Monitoring:</strong> Your face will be monitored throughout the quiz</span>
                </li>
                <li className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Tab Switching Detection:</strong> Switching tabs will be flagged and reported</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Copy-Paste Disabled:</strong> You cannot copy or paste content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Auto-Submit:</strong> Quiz will auto-submit when time runs out</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Before you start:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Ensure your webcam is enabled and working</li>
                <li>✓ Find a quiet, well-lit environment</li>
                <li>✓ Close all other tabs and applications</li>
                <li>✓ Keep your face visible to the camera at all times</li>
                <li>✓ Do not leave the quiz window</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/quizzes')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setQuizStarted(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg"
            >
              I Understand, Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warning Banner for Tab Switching */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <p className="font-semibold">WARNING: Tab switching detected! This violation has been recorded.</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Newton's Laws Quiz</h2>
              <p className="text-sm text-gray-600">Physics 202</p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Webcam Status */}
              <div className="flex items-center gap-2">
                {webcamActive ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <Camera className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Camera Active</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Camera Inactive</span>
                  </>
                )}
              </div>

              {/* Tab Switch Counter */}
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    {tabSwitchCount} violation{tabSwitchCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {answeredQuestions}/{mockQuestions.length} answered
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-blue-600">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </span>
              {answers[currentQuestion] !== undefined && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <h3 className="text-xl font-medium text-gray-900">
              {mockQuestions[currentQuestion].question}
            </h3>
          </div>

          <div className="space-y-3">
            {mockQuestions[currentQuestion].options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  checked={answers[currentQuestion] === index}
                  onChange={() => setAnswers({ ...answers, [currentQuestion]: index })}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {mockQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === mockQuestions.length - 1 ? (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-lg"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(mockQuestions.length - 1, currentQuestion + 1))}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Quiz?</h3>
            <p className="text-gray-600 mb-6">
              You have answered {answeredQuestions} out of {mockQuestions.length} questions.
              {answeredQuestions < mockQuestions.length && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Warning: {mockQuestions.length - answeredQuestions} question(s) remain unanswered.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

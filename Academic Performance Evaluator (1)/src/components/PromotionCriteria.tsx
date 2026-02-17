import { Award, CheckCircle, Lock, AlertTriangle } from 'lucide-react';

interface PromotionRule {
  fromLevel: string;
  toLevel: string;
  threshold: number;
  consecutiveRequired: number;
  description: string;
}

const promotionRules: PromotionRule[] = [
  {
    fromLevel: 'Beginner',
    toLevel: 'Intermediate',
    threshold: 66,
    consecutiveRequired: 3,
    description: 'Student must score 66% or above in 3 consecutive level-appropriate quizzes'
  },
  {
    fromLevel: 'Intermediate',
    toLevel: 'Advanced',
    threshold: 82,
    consecutiveRequired: 3,
    description: 'Student must score 82% or above in 3 consecutive level-appropriate quizzes'
  }
];

const examplePromotionScenarios = [
  {
    student: 'Michael Brown',
    level: 'Beginner',
    quizzes: [
      { quiz: 'Beginner Quiz 1', score: 68, meetsThreshold: true },
      { quiz: 'Beginner Quiz 2', score: 70, meetsThreshold: true },
      { quiz: 'Beginner Quiz 3', score: 67, meetsThreshold: true },
    ],
    result: 'Promoted to Intermediate',
    promoted: true
  },
  {
    student: 'Emma Thompson',
    level: 'Intermediate',
    quizzes: [
      { quiz: 'Intermediate Quiz 1', score: 84, meetsThreshold: true },
      { quiz: 'Intermediate Quiz 2', score: 78, meetsThreshold: false },
      { quiz: 'Intermediate Quiz 3', score: 85, meetsThreshold: true },
    ],
    result: 'Not Promoted (consistency broken)',
    promoted: false
  },
  {
    student: 'Emma Thompson (After)',
    level: 'Intermediate',
    quizzes: [
      { quiz: 'Intermediate Quiz 4', score: 83, meetsThreshold: true },
      { quiz: 'Intermediate Quiz 5', score: 84, meetsThreshold: true },
      { quiz: 'Intermediate Quiz 6', score: 86, meetsThreshold: true },
    ],
    result: 'Promoted to Advanced',
    promoted: true
  }
];

export function PromotionCriteria() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Automatic Promotion System</h3>
        <p className="text-gray-600">Students are automatically promoted based on consistent performance. Manual promotion is disabled.</p>
      </div>

      {/* Promotion Rules */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Promotion Requirements</h4>
        <div className="space-y-4">
          {promotionRules.map((rule, index) => (
            <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <h5 className="font-semibold text-gray-900">
                    {rule.fromLevel} → {rule.toLevel}
                  </h5>
                </div>
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                  Threshold: {rule.threshold}%
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3">{rule.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-gray-600 text-xs mb-1">Minimum Score</p>
                  <p className="font-bold text-gray-900">{rule.threshold}%</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-gray-600 text-xs mb-1">Consecutive Quizzes</p>
                  <p className="font-bold text-gray-900">{rule.consecutiveRequired}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-gray-600 text-xs mb-1">Quiz Type</p>
                  <p className="font-bold text-gray-900">{rule.fromLevel} Level</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-yellow-900 mb-2">Important Promotion Rules</h5>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>No Manual Override:</strong> Teachers and admins cannot manually promote students. The system automatically promotes based on quiz performance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Consistency Required:</strong> Students must achieve the threshold score in consecutive quizzes. One quiz below threshold resets the counter.</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Level-Appropriate Quizzes:</strong> Only quizzes designed for the student's current level count toward promotion.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Reset on Failure:</strong> If a student scores below the threshold, their consecutive count resets to zero and they must start again.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Scenarios */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Example Promotion Scenarios</h4>
        <div className="space-y-6">
          {examplePromotionScenarios.map((scenario, index) => (
            <div key={index} className={`border-2 rounded-lg p-4 ${
              scenario.promoted ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-gray-900">{scenario.student}</h5>
                  <p className="text-sm text-gray-600">Current Level: {scenario.level}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  scenario.promoted 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {scenario.result}
                </span>
              </div>
              
              <div className="space-y-2">
                {scenario.quizzes.map((quiz, qIdx) => (
                  <div key={qIdx} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-900">{quiz.quiz}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${
                        quiz.meetsThreshold ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {quiz.score}%
                      </span>
                      {quiz.meetsThreshold ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-red-500 font-bold">×</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-sm">
                  {scenario.promoted ? (
                    <span className="text-green-700">
                      <strong>✓ Success:</strong> Student met the threshold in all 3 consecutive quizzes and was automatically promoted.
                    </span>
                  ) : (
                    <span className="text-red-700">
                      <strong>× Failed:</strong> Student scored below threshold in Quiz 2, breaking the consistency requirement. Must start over.
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Behavior */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-900 mb-3">How the System Works</h5>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Student takes a quiz designed for their current level (Beginner, Intermediate, or Advanced)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>System checks if score meets or exceeds the promotion threshold for that level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>If yes, the "consecutive above threshold" counter increments by 1</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>If no, the counter resets to 0, and the student must start over</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
            <span>When counter reaches 3, the system automatically promotes the student to the next level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
            <span>Student now receives quizzes appropriate for their new level</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Award, Target, AlertCircle, Plus, X } from 'lucide-react';

const levels = [
  { value: 'beginner', label: 'Beginner', color: 'orange', description: '0-65% performers' },
  { value: 'intermediate', label: 'Intermediate', color: 'blue', description: '66-81% performers' },
  { value: 'advanced', label: 'Advanced', color: 'green', description: '82-100% performers' },
];

const questionDifficulty = {
  beginner: [
    { type: 'Multiple Choice', recommended: '80%', description: 'Simple recall questions' },
    { type: 'True/False', recommended: '15%', description: 'Basic concepts' },
    { type: 'Fill in Blanks', recommended: '5%', description: 'Simple completion' },
  ],
  intermediate: [
    { type: 'Multiple Choice', recommended: '50%', description: 'Application-based questions' },
    { type: 'Short Answer', recommended: '30%', description: 'Explain concepts' },
    { type: 'Problem Solving', recommended: '20%', description: 'Apply knowledge' },
  ],
  advanced: [
    { type: 'Complex Problem Solving', recommended: '40%', description: 'Multi-step problems' },
    { type: 'Essay/Analysis', recommended: '30%', description: 'Critical thinking' },
    { type: 'Case Studies', recommended: '30%', description: 'Real-world application' },
  ],
};

export function LevelBasedQuizCreator() {
  const [selectedLevel, setSelectedLevel] = useState('intermediate');
  const [quizTitle, setQuizTitle] = useState('');
  const [targetStudents, setTargetStudents] = useState<string[]>([]);
  const [customWeakArea, setCustomWeakArea] = useState('');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create Level-Based Quiz</h3>
        <p className="text-sm text-gray-600">Design quizzes tailored to specific performance levels and student needs.</p>
      </div>

      {/* Level Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Target Level</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => setSelectedLevel(level.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLevel === level.value
                  ? `border-${level.color}-500 bg-${level.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-5 h-5 ${
                  selectedLevel === level.value ? `text-${level.color}-600` : 'text-gray-400'
                }`} />
                <h4 className={`font-semibold ${
                  selectedLevel === level.value ? `text-${level.color}-900` : 'text-gray-700'
                }`}>
                  {level.label}
                </h4>
              </div>
              <p className="text-xs text-gray-600">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Details */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder={`e.g., ${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level - Physics Fundamentals`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              placeholder={selectedLevel === 'beginner' ? '30' : selectedLevel === 'intermediate' ? '45' : '60'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
            <input
              type="number"
              placeholder={selectedLevel === 'beginner' ? '15' : selectedLevel === 'intermediate' ? '20' : '25'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Recommended Question Distribution */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2 mb-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Recommended Question Distribution for {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level
            </h4>
            <p className="text-sm text-blue-800 mb-3">Based on pedagogical best practices for this performance level</p>
          </div>
        </div>
        <div className="space-y-2">
          {questionDifficulty[selectedLevel as keyof typeof questionDifficulty].map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
              <div>
                <p className="font-medium text-gray-900">{item.type}</p>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {item.recommended}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Specific Weak Areas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Specific Weak Areas (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={customWeakArea}
            onChange={(e) => setCustomWeakArea(e.target.value)}
            placeholder="e.g., Newton's Laws, Calculus Integration"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (customWeakArea) {
                setTargetStudents([...targetStudents, customWeakArea]);
                setCustomWeakArea('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {targetStudents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {targetStudents.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {area}
                <button
                  onClick={() => setTargetStudents(targetStudents.filter((_, i) => i !== index))}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Level-Specific Features */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">
              {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level Features
            </h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              {selectedLevel === 'beginner' && (
                <>
                  <li>• Extended time allowance for completion</li>
                  <li>• Simpler language and clear instructions</li>
                  <li>• Hints available for difficult questions</li>
                  <li>• Lower passing threshold (50%)</li>
                  <li>• Immediate feedback after submission</li>
                </>
              )}
              {selectedLevel === 'intermediate' && (
                <>
                  <li>• Standard time allowance</li>
                  <li>• Mix of recall and application questions</li>
                  <li>• Moderate passing threshold (60%)</li>
                  <li>• Detailed performance analysis</li>
                  <li>• Promotion opportunity if score ≥82%</li>
                </>
              )}
              {selectedLevel === 'advanced' && (
                <>
                  <li>• Challenging time constraints</li>
                  <li>• Complex problem-solving focus</li>
                  <li>• Higher passing threshold (70%)</li>
                  <li>• Peer comparison analytics</li>
                  <li>• Opportunity for bonus questions</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Auto-Assignment Settings */}
      <div className="mb-6">
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" className="w-4 h-4 text-green-600 rounded" defaultChecked />
          <span className="text-sm font-medium text-gray-700">
            Auto-assign to all {selectedLevel} level students
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
          <span className="text-sm font-medium text-gray-700">
            Auto-promote students who score above level threshold
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          Save as Draft
        </button>
        <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
          Create & Assign Quiz
        </button>
      </div>
    </div>
  );
}

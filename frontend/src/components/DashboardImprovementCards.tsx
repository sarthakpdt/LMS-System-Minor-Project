import { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, Target, Zap, Award, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:5000/api';

interface ImprovementArea {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weakScore: number;
  questionCount: number;
  suggestion: string;
  resource?: string;
}

interface DashboardImprovementCards {
  userId: string;
  assignments: any[];
}

export function DashboardImprovementCards({ userId, assignments }: DashboardImprovementCards) {
  const [improvements, setImprovements] = useState<ImprovementArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignments || assignments.length === 0) {
      setLoading(false);
      return;
    }

    // Analyze assignments to identify weak areas
    const weakAreas: Record<string, { scores: number[]; count: number; topics: Set<string> }> = {};

    assignments.forEach(assignment => {
      if (!assignment.submissions) return;

      assignment.submissions.forEach(submission => {
        if (submission.percentage < 70) {
          // This submission is below target
          submission.answers?.forEach((ans, idx) => {
            if (!ans.isCorrect && assignment.questions[idx]) {
              const q = assignment.questions[idx];
              const key = q.difficulty || 'medium';
              
              if (!weakAreas[key]) {
                weakAreas[key] = { scores: [], count: 0, topics: new Set() };
              }
              weakAreas[key].scores.push(ans.marksAwarded || 0 / (q.marks || 1));
              weakAreas[key].count++;
              
              // Extract potential topic from question text
              const topic = extractTopic(q.questionText);
              if (topic) weakAreas[key].topics.add(topic);
            }
          });
        }
      });
    });

    // Convert to improvement cards
    const cards: ImprovementArea[] = [];

    Object.entries(weakAreas).forEach(([difficulty, data]) => {
      const avgScore = data.scores.length > 0 
        ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 100).toFixed(0)
        : '0';

      cards.push({
        topic: Array.from(data.topics)[0] || `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Questions`,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        weakScore: parseInt(avgScore),
        questionCount: data.count,
        suggestion: getSuggestion(difficulty as 'easy' | 'medium' | 'hard', parseInt(avgScore)),
        resource: getResourceLink(difficulty as 'easy' | 'medium' | 'hard'),
      });
    });

    // Sort by weakScore ascending
    setImprovements(cards.slice(0, 3).sort((a, b) => a.weakScore - b.weakScore));
    setLoading(false);
  }, [assignments]);

  if (loading || improvements.length === 0) return null;

  const COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    easy: { bg: 'bg-green-50', border: 'border-green-200', icon: '🟢', text: 'text-green-700' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡', text: 'text-yellow-700' },
    hard: { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', text: 'text-red-700' },
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-600" /> Areas for Improvement
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {improvements.map((area, idx) => {
          const colors = COLORS[area.difficulty];
          return (
            <div key={idx} className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 shadow-sm hover:shadow-md transition`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>{colors.icon}</span> {area.topic}
                  </h4>
                  <p className={`text-xs ${colors.text} font-semibold mt-1`}>
                    {area.difficulty.charAt(0).toUpperCase() + area.difficulty.slice(1)} Difficulty
                  </p>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {area.weakScore}%
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-1.5 mb-4 pb-4 border-b border-gray-300/30">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <Target className="w-3 h-3" /> {area.questionCount} question{area.questionCount > 1 ? 's' : ''} missed
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Need 70%+ to master
                </p>
              </div>

              {/* Suggestion */}
              <p className={`text-xs ${colors.text} font-semibold mb-3`}>
                💡 {area.suggestion}
              </p>

              {/* Action Button */}
              {area.resource && (
                <a href={area.resource} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 ${colors.border} rounded-lg text-xs font-semibold transition ${colors.text} hover:bg-gray-50`}>
                  <BookOpen className="w-3 h-3" />
                  View Resources
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────

function extractTopic(questionText: string): string | null {
  const topics = [
    'binary', 'tree', 'graph', 'sort', 'search', 'hash', 'queue', 'stack',
    'array', 'linked', 'recursion', 'dynamic', 'greedy', 'string', 'number',
    'algebra', 'geometry', 'calculus', 'physics', 'chemistry', 'biology',
    'function', 'variable', 'loop', 'condition', 'pointer', 'structure'
  ];

  const lower = questionText.toLowerCase();
  for (const topic of topics) {
    if (lower.includes(topic)) {
      return topic.charAt(0).toUpperCase() + topic.slice(1);
    }
  }
  return null;
}

function getSuggestion(difficulty: 'easy' | 'medium' | 'hard', score: number): string {
  if (difficulty === 'easy') {
    return score < 40 
      ? 'Review fundamentals - start with basic concepts'
      : 'Practice easier problems to build confidence';
  } else if (difficulty === 'medium') {
    return score < 40
      ? 'Learn step-by-step problem solving approaches'
      : 'Practice intermediate problems with multiple attempts';
  } else {
    return score < 40
      ? 'Study advanced topics with guided examples'
      : 'Attempt harder problems to strengthen skills';
  }
}

function getResourceLink(difficulty: 'easy' | 'medium' | 'hard'): string {
  const baseUrl = 'https://www.coursera.org/courses?query=';
  const topics: Record<string, string> = {
    easy: 'introduction to algorithms',
    medium: 'data structures and algorithms',
    hard: 'advanced competitive programming',
  };
  return baseUrl + encodeURIComponent(topics[difficulty]);
}

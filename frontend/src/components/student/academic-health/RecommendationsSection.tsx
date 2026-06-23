import { Lightbulb, ArrowRight } from 'lucide-react';
import { Card, Badge } from '../../../theme/components';
import type { Recommendation } from './types';

const PRIORITY_CONFIG = {
  high: { variant: 'error' as const, label: 'High Priority' },
  medium: { variant: 'warning' as const, label: 'Medium' },
  low: { variant: 'success' as const, label: 'Low' },
};

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Recommendations</h3>
        <Badge variant="success" size="sm">Data-Driven</Badge>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const config = PRIORITY_CONFIG[rec.priority];
          return (
            <Card key={idx} hover className="group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={config.variant} size="sm">{config.label}</Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{rec.category}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {rec.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rec.reason}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

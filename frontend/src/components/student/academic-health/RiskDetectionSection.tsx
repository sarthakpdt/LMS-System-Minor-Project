import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Badge } from '../../../theme/components';
import type { AcademicRisk } from './types';

const SEVERITY_CONFIG = {
  Low: {
    icon: CheckCircle,
    badge: 'success' as const,
    border: 'border-green-200 dark:border-green-800/40',
    bg: 'bg-green-50/50 dark:bg-green-900/10',
  },
  Medium: {
    icon: AlertTriangle,
    badge: 'warning' as const,
    border: 'border-amber-200 dark:border-amber-800/40',
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
  },
  High: {
    icon: ShieldAlert,
    badge: 'error' as const,
    border: 'border-red-200 dark:border-red-800/40',
    bg: 'bg-red-50/50 dark:bg-red-900/10',
  },
};

interface RiskDetectionSectionProps {
  risks: AcademicRisk[];
}

export function RiskDetectionSection({ risks }: RiskDetectionSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Academic Risk Detection</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk) => {
          const config = SEVERITY_CONFIG[risk.severity];
          const Icon = config.icon;
          return (
            <Card
              key={risk.type}
              className={`${config.border} ${config.bg}`}
              hover={false}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <Icon className={`w-5 h-5 ${
                    risk.severity === 'High' ? 'text-red-600 dark:text-red-400' :
                    risk.severity === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                    'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{risk.type}</p>
                    <Badge variant={config.badge} size="sm">{risk.severity}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{risk.description}</p>
                  {risk.metric != null && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Metric: {risk.metric}%
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { Award, Minus, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../../../theme/components';
import type { SubjectStrength } from './types';

interface SubjectStrengthSectionProps {
  strong: SubjectStrength[];
  average: SubjectStrength[];
  weak: SubjectStrength[];
}

function SubjectList({
  title,
  subjects,
  icon,
  colorClass,
  badgeVariant,
}: {
  title: string;
  subjects: SubjectStrength[];
  icon: React.ReactNode;
  colorClass: string;
  badgeVariant: 'success' | 'warning' | 'error';
}) {
  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <Badge variant={badgeVariant} size="sm">{subjects.length}</Badge>
      </div>
      {subjects.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No subjects in this category</p>
      ) : (
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li
              key={`${s.name}-${s.courseCode}`}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                {s.courseCode && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.courseCode}</p>
                )}
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{s.averageScore}%</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function SubjectStrengthSection({ strong, average, weak }: SubjectStrengthSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subject Strength Analysis</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SubjectList
          title="Strong Subjects"
          subjects={strong}
          icon={<Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          colorClass="bg-emerald-100 dark:bg-emerald-900/30"
          badgeVariant="success"
        />
        <SubjectList
          title="Average Subjects"
          subjects={average}
          icon={<Minus className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
          badgeVariant="warning"
        />
        <SubjectList
          title="Weak Subjects"
          subjects={weak}
          icon={<AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
          colorClass="bg-red-100 dark:bg-red-900/30"
          badgeVariant="error"
        />
      </div>
    </div>
  );
}

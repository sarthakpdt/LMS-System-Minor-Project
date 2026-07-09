import React from 'react';
import { TtConflict } from './types';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface ConflictViewerProps {
  conflicts: TtConflict[];
}

export default function ConflictViewer({ conflicts }: ConflictViewerProps) {
  if (conflicts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3 text-emerald-800">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Schedule is Conflict-Free</h4>
          <p className="text-xs text-emerald-600 mt-0.5">All constraints, room capacities, lunch breaks, and faculty schedules are aligned successfully.</p>
        </div>
      </div>
    );
  }

  // Sort conflicts so errors appear before warnings
  const sortedConflicts = [...conflicts].sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (a.severity !== 'error' && b.severity === 'error') return 1;
    return 0;
  });

  const errorsCount = conflicts.filter(c => c.severity === 'error').length;
  const warningsCount = conflicts.filter(c => c.severity === 'warning').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            Conflict Detection Log
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Review validation logs before publishing the timetable draft.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-red-50 text-red-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-red-100">
            {errorsCount} Error{errorsCount !== 1 ? 's' : ''}
          </span>
          <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-amber-100">
            {warningsCount} Warning{warningsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 pr-2 space-y-2">
        {sortedConflicts.map((c, idx) => {
          const isError = c.severity === 'error';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border text-xs leading-relaxed transition ${
                isError 
                  ? 'bg-red-50/50 border-red-100 text-red-800' 
                  : 'bg-amber-50/50 border-amber-100 text-amber-800'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold uppercase text-[9px] block tracking-wide mb-0.5">
                  {c.type} {c.severity}
                </span>
                <p className="text-gray-700">{c.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

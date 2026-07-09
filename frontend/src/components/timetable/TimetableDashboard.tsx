import React, { useState } from 'react';
import ConfigPanel from './ConfigPanel';
import ConfigDashboard from './ConfigDashboard';
import TimetableGenerationEngine from './TimetableGenerationEngine';
import FacultySchedule from './FacultySchedule';
import TimetableAnalytics from './TimetableAnalytics';
import TimetableViewDashboard from './TimetableViewDashboard';
import { Calendar, Settings2, Settings, Users, BarChart3, Sparkles, LayoutGrid } from 'lucide-react';

export default function TimetableDashboard() {
  const [activeTab, setActiveTab] = useState<'view' | 'config' | 'generate' | 'advanced' | 'faculty' | 'analytics'>('view');

  return (
    <div className="flex flex-col bg-gray-50" style={{ minHeight: '100vh' }}>
      {/* Header Panel */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-200/50 bg-gray-50 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <Calendar className="w-7 h-7 text-purple-600" /> Automatic Timetable Suite
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure academic structure, subjects, faculty, rooms, and constraints before generation.
            </p>
          </div>

          {/* Tab Controls */}
          <div className="bg-white border border-gray-200 p-1 rounded-2xl flex gap-1 shadow-sm flex-wrap">
            {[
              { id: 'view', label: 'Interactive View', icon: LayoutGrid },
              { id: 'config', label: 'Configuration', icon: Settings2 },
              { id: 'generate', label: 'AI Generator', icon: Sparkles },
              { id: 'advanced', label: 'Advanced Config', icon: Settings },
              { id: 'faculty', label: 'Faculty Views', icon: Users },
              { id: 'analytics', label: 'Analytics & Workloads', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      {activeTab === 'view' ? (
        /* Interactive View needs a flex-fill container with defined height */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <TimetableViewDashboard />
        </div>
      ) : (
        /* All other tabs scroll freely */
        <div className="flex-1 overflow-auto px-8 py-6">
          {activeTab === 'config' && <ConfigDashboard />}
          {activeTab === 'generate' && <TimetableGenerationEngine />}
          {activeTab === 'advanced' && <ConfigPanel />}
          {activeTab === 'faculty' && <FacultySchedule />}
          {activeTab === 'analytics' && <TimetableAnalytics />}
        </div>
      )}
    </div>
  );
}
export { TimetableDashboard };

import React, { useState } from 'react';
import ConfigPanel from './ConfigPanel';
import SetupWizard from './SetupWizard';
import FacultySchedule from './FacultySchedule';
import { Calendar, Wand2, Settings, Users } from 'lucide-react';

export default function TimetableDashboard() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'advanced' | 'faculty'>('wizard');

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
            <Calendar className="w-7 h-7 text-purple-600" /> Automatic Timetable Suite
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Build, test, validate, and execute conflict-free college-wide academic schedules.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="bg-white border border-gray-200 p-1 rounded-2xl flex gap-1 shadow-sm w-fit">
          {[
            { id: 'wizard', label: 'Setup Wizard', icon: Wand2 },
            { id: 'advanced', label: 'Advanced Config', icon: Settings },
            { id: 'faculty', label: 'Faculty Views', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* Main Panel Content */}
      <div className="transition-all duration-300">
        {activeTab === 'wizard' && <SetupWizard />}
        {activeTab === 'advanced' && <ConfigPanel />}
        {activeTab === 'faculty' && <FacultySchedule />}
      </div>
    </div>
  );
}
export { TimetableDashboard };

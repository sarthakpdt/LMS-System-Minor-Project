import React, { useState, useEffect } from 'react';
import { api } from './api';
import { TtConfig, TtEntry, Teacher } from './types';
import TimetableGrid from './TimetableGrid';
import { Loader2, Calendar, User, Info } from 'lucide-react';

interface FacultyScheduleProps {
  fixedFacultyId?: string; // If passed, locks the component to this teacher (for Teacher Portal)
}

export default function FacultySchedule({ fixedFacultyId }: FacultyScheduleProps) {
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const configRes = await api.getConfig();
      setConfig(configRes.config);

      // Load teachers list if not fixed
      if (!fixedFacultyId) {
        const teachersRes = await api.getTeachers();
        setTeachers(teachersRes.data);
        if (teachersRes.data.length > 0) {
          setSelectedFacultyId(teachersRes.data[0]._id);
        }
      } else {
        setSelectedFacultyId(fixedFacultyId);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading faculty data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [fixedFacultyId]);

  useEffect(() => {
    if (!selectedFacultyId) return;

    const fetchFacultySchedule = async () => {
      setSearching(true);
      setError('');
      try {
        const res = await api.getPublished({ facultyId: selectedFacultyId });
        setEntries(res.entries);
      } catch (err: any) {
        setError(err.message || 'Error fetching faculty schedule.');
      } finally {
        setSearching(false);
      }
    };

    fetchFacultySchedule();
  }, [selectedFacultyId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-medium">Loading Faculty Schedules Workspace...</p>
      </div>
    );
  }

  // Map entries format to display branch/year/section in cells
  // For the grid component, it expects subjectName. We can augment it to show "Subject (Branch Yr Sec)"
  const gridEntries = entries.map(e => ({
    ...e,
    subjectName: `${e.subjectName} [${e.branch} Yr ${e.year} Sec ${e.section}]`
  }));

  const activeTeacher = teachers.find(t => t._id === selectedFacultyId);

  return (
    <div className="space-y-6">
      {/* Selector card */}
      {!fixedFacultyId && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <div className="flex justify-between items-center border-b pb-2.5">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Select Faculty Member</h4>
            <span className="text-[10px] text-gray-400">View live scheduled workload metrics</span>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">FACULTY MEMBER</label>
            <select
              value={selectedFacultyId}
              onChange={e => setSelectedFacultyId(e.target.value)}
              className="w-full sm:max-w-md border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium dark:bg-slate-800 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <option value="">Choose Instructor...</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.employeeId})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {searching ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
          <p className="text-xs">Fetching live schedule updates...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center space-y-3 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700/50">
          <User className="w-12 h-12 mx-auto text-gray-300 opacity-80" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm">No Live Classes Assigned</h4>
            <p className="text-xs text-gray-500 px-6 mt-1">
              {fixedFacultyId 
                ? 'You do not have any classes assigned in the published college timetable currently.' 
                : `${activeTeacher ? activeTeacher.name : 'The selected teacher'} does not have any classes scheduled in the active published timetable.`}
            </p>
          </div>
        </div>
      ) : (
        config && <TimetableGrid entries={gridEntries} config={config} />
      )}
    </div>
  );
}

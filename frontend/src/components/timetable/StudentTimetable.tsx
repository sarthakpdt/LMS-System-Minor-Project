import React, { useState, useEffect } from 'react';
import { api } from './api';
import { TtConfig, TtEntry } from './types';
import TimetableGrid from './TimetableGrid';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Calendar, AlertCircle, Info } from 'lucide-react';

export default function StudentTimetable() {
  const { user } = useAuth();
  const [config, setConfig] = useState<TtConfig | null>(null);
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentMeta, setStudentMeta] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadStudentSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const configRes = await api.getConfig();
        setConfig(configRes.config);

        const scheduleRes = await api.getPublishedForStudent(user.id);
        setEntries(scheduleRes.entries);
        setStudentMeta(scheduleRes.studentMeta);
      } catch (err: any) {
        setError(err.message || 'Error loading student schedule.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentSchedule();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-medium">Fetching your weekly class schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-5 text-xs max-w-lg mx-auto mt-10">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" /> My Class Timetable
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Weekly schedule for {studentMeta?.department} | Year {studentMeta?.year} | Semester {studentMeta?.semester}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-gray-400 block uppercase">Timetable Status</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100 mt-0.5 inline-block">
            Published Live
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center space-y-3 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto text-gray-300" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm">No Timetable Published</h4>
            <p className="text-xs text-gray-500 px-6 mt-1">
              Your department does not have a live published schedule currently. Please contact the administrator.
            </p>
          </div>
        </div>
      ) : (
        config && <TimetableGrid entries={entries} config={config} />
      )}
    </div>
  );
}

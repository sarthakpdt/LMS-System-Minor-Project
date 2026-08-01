import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, AlertTriangle,
  Loader2, Filter, Search, ChevronRight, BookOpen, CalendarDays, RefreshCw
} from 'lucide-react';
import { teacherScheduleApi, TeacherSlot, AttendanceSlot } from './TeacherScheduleApi';
import AttendanceTaker from '../attendance/AttendanceTaker';

interface Props {
  teacherId: string;
  teacherName?: string;
}

export default function TeacherScheduleDashboard({ teacherId, teacherName = 'Teacher' }: Props) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'attendance'>('today');

  // Loading/Error states
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [todaySlots, setTodaySlots] = useState<TeacherSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState<TeacherSlot | null>(null);
  const [upcomingSlots, setUpcomingSlots] = useState<TeacherSlot[]>([]);
  const [missedSlots, setMissedSlots] = useState<TeacherSlot[]>([]);

  const [weeklySlots, setWeeklySlots] = useState<Record<string, TeacherSlot[]>>({});
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [uniqueSections, setUniqueSections] = useState<string[]>([]);

  const [attendanceSlots, setAttendanceSlots] = useState<AttendanceSlot[]>([]);

  // Filtering states for weekly view
  const [filterSemester, setFilterSemester] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');

  // Selection for attendance taker
  const [selectedSlotForAttendance, setSelectedSlotForAttendance] = useState<any | null>(null);

  // Load Today's schedule
  const loadToday = async () => {
    setLoadingToday(true);
    try {
      const res = await teacherScheduleApi.getTodaySchedule(teacherId);
      setTodaySlots(res.slots || []);
      setCurrentSlot(res.currentSlot);
      setUpcomingSlots(res.upcomingSlots || []);
      setMissedSlots(res.missedSlots || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load today\'s schedule');
    } finally {
      setLoadingToday(false);
    }
  };

  // Load Weekly schedule
  const loadWeek = async () => {
    setLoadingWeek(true);
    try {
      const res = await teacherScheduleApi.getWeeklySchedule(teacherId, {
        semester: filterSemester ? Number(filterSemester) : undefined,
        section: filterSection || undefined,
        subject: filterSubject || undefined,
        day: filterDay || undefined,
      });
      setWeeklySlots(res.grouped || {});
      setWorkingDays(res.workingDays || []);
      setUniqueSubjects(res.uniqueSubjects || []);
      setUniqueSections(res.uniqueSections || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingWeek(false);
    }
  };

  // Load Attendance slots
  const loadAttendanceSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await teacherScheduleApi.getAttendanceSlots(teacherId);
      setAttendanceSlots(res.slots || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadToday();
    loadAttendanceSlots();
  }, [teacherId]);

  useEffect(() => {
    if (activeTab === 'week') {
      loadWeek();
    }
  }, [activeTab, filterSemester, filterSection, filterSubject, filterDay]);

  const handleTakeAttendance = (slot: any) => {
    // Standardize structure for AttendanceTaker
    const stdSlot = {
      _id: slot._id,
      subject: slot.subject || slot.subjectName,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      semester: slot.semester || slot.year,
      department: slot.department || slot.branch,
      section: slot.section,
    };
    setSelectedSlotForAttendance(stdSlot);
    setActiveTab('attendance');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Teacher Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your schedule, view weekly classes, and submit attendance easily.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadToday();
              if (activeTab === 'week') loadWeek();
              loadAttendanceSlots();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 bg-slate-50 border border-slate-100 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-100 p-1 rounded-2xl flex gap-1 shadow-sm w-fit">
        {[
          { id: 'today', label: 'Today\'s Classes', icon: Clock },
          { id: 'week', label: 'Weekly Timetable', icon: CalendarDays },
          { id: 'attendance', label: 'Attendance Taker', icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id !== 'attendance') {
                setSelectedSlotForAttendance(null);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* TODAY'S CLASSES TAB */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Missed Attendance Alert Banner */}
          {missedSlots.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 shadow-sm animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Missed Attendance Submissions</h4>
                <p className="text-xs text-amber-700 mt-1">
                  You have not submitted attendance for the following completed slots:
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {missedSlots.map((slot) => (
                    <div key={slot._id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="font-bold">{slot.subject}</span> (Sem {slot.semester} · Section {slot.section}) at {slot.startTime}–{slot.endTime}
                      <button
                        onClick={() => handleTakeAttendance(slot)}
                        className="ml-2 text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700 transition-colors"
                      >
                        Submit Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current / Ongoing Class */}
          {currentSlot && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Ongoing Class</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{currentSlot.subject}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Room {currentSlot.room || 'TBA'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {currentSlot.startTime} – {currentSlot.endTime}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-lg">Sem {currentSlot.semester} · Section {currentSlot.section}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTakeAttendance(currentSlot)}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all hover:scale-[1.02]"
                >
                  Take Attendance
                </button>
              </div>
            </div>
          )}

          {/* Today's Schedule Cards */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Today's Class Schedule</h3>
            {loadingToday ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : todaySlots.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium">No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySlots.map((slot) => {
                  const statusColors = {
                    ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    upcoming: 'bg-blue-50 text-blue-700 border-blue-100',
                    completed: 'bg-slate-50 text-slate-500 border-slate-100',
                  };

                  return (
                    <div
                      key={slot._id}
                      className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                        slot.status === 'ongoing' ? 'ring-2 ring-emerald-500/30' : ''
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-lg ${statusColors[slot.status || 'upcoming']}`}>
                            {slot.status}
                          </span>
                          {slot.status === 'completed' && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                              slot.attendanceSubmitted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {slot.attendanceSubmitted ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {slot.attendanceSubmitted ? 'Completed' : 'Missed'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug">{slot.subject}</h4>
                        <div className="space-y-2 mt-4 text-xs text-slate-500">
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {slot.room || 'TBA'}</div>
                          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {slot.startTime} – {slot.endTime}</div>
                          <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> Sem {slot.semester} · Section {slot.section} · {slot.department}</div>
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="mt-5 pt-4 border-t border-slate-50">
                        {slot.status === 'completed' && slot.attendanceSubmitted ? (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-center py-2 bg-emerald-50/50 rounded-xl">
                            <CheckCircle className="w-3.5 h-3.5" /> Attendance Submitted
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTakeAttendance(slot)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                              slot.status === 'ongoing'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : slot.status === 'completed'
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {slot.status === 'completed' ? 'Submit Attendance' : 'Mark Attendance'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEKLY TIMETABLE TAB */}
      {activeTab === 'week' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
            {/* Subject */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject…"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-transparent text-xs outline-none w-36"
              />
            </div>

            {/* Semester Filter */}
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none cursor-pointer"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none cursor-pointer"
            >
              <option value="">All Sections</option>
              {uniqueSections.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>

            {/* Day Filter */}
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none cursor-pointer"
            >
              <option value="">All Days</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(filterSemester || filterSection || filterSubject || filterDay) && (
              <button
                onClick={() => {
                  setFilterSemester('');
                  setFilterSection('');
                  setFilterSubject('');
                  setFilterDay('');
                }}
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Grid Display */}
          {loadingWeek ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workingDays.map((day) => {
                const daySlots = weeklySlots[day] || [];
                if (filterDay && day !== filterDay) return null;

                return (
                  <div key={day} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                      <span>{day}</span>
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {daySlots.length} slots
                      </span>
                    </h4>
                    {daySlots.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No classes scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map((slot) => (
                          <div
                            key={slot._id}
                            className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                                <span className="text-[9px] font-semibold text-slate-400">
                                  Room {slot.room || 'TBA'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 mt-2">{slot.subject}</h5>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Semester {slot.semester} · Section {slot.section} · {slot.department}
                              </p>
                            </div>
                            <button
                              onClick={() => handleTakeAttendance(slot)}
                              className="mt-3 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-0.5 transition-all self-end"
                            >
                              Take Attendance <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE TAKER TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 sm:p-6">
          {selectedSlotForAttendance && (
            <div className="mb-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
              <div className="text-xs">
                <span className="font-bold text-indigo-800">Auto-Selected Lecture:</span>{' '}
                <span className="font-medium text-slate-700">
                  {selectedSlotForAttendance.subject} (Semester {selectedSlotForAttendance.semester} · Section {selectedSlotForAttendance.section})
                </span>
                <span className="text-slate-400 ml-2">
                  {selectedSlotForAttendance.startTime} – {selectedSlotForAttendance.endTime}
                </span>
              </div>
              <button
                onClick={() => setSelectedSlotForAttendance(null)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Reset Selection
              </button>
            </div>
          )}
          <AttendanceTaker
            teacherId={teacherId}
            teacherName={teacherName}
            autoSelectedSlot={selectedSlotForAttendance}
          />
        </div>
      )}
    </div>
  );
}

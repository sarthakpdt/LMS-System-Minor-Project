import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar, Clock, MapPin, User, Search, Loader2,
  BookOpen, ChevronRight, CheckCircle2, XCircle, HelpCircle,
  ArrowRight, BellRing, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface TtTimeSlot {
  label: string;
  startTime: string;
  endTime: string;
}

interface TtEntry {
  _id?: string;
  branch: string;
  year: number;
  section: string;
  day: string;
  timeSlot: TtTimeSlot;
  subjectId: string | null;
  subjectName: string;
  subjectType: 'theory' | 'lab' | 'tutorial' | 'exam' | 'free' | 'lunch';
  facultyId: string | null;
  facultyName: string;
  roomId: string | null;
  roomName: string;
  isLunch: boolean;
  isFree: boolean;
}

interface AttendanceRecord {
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late';
  teacherName?: string;
}

interface AttendanceSubjectStats {
  subject: string;
  courseCode: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendancePercentage: number;
  riskLevel: 'safe' | 'warning' | 'critical';
}

export default function StudentTimetable() {
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [entries, setEntries] = useState<TtEntry[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceSubjectStats[]>([]);
  const [studentMeta, setStudentMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<any | null>(null);

  // Time ticker state (for upcoming remaining time)
  const [nowTime, setNowTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem('lms_user');
      const token = user?.token || (storedUser ? JSON.parse(storedUser).token : null);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch published timetable entries
      const ttRes = await fetch(`${API}/timetable/engine/published/student/${user.id}`, { headers });
      if (!ttRes.ok) {
        throw new Error('Timetable not published or failed to fetch.');
      }
      const ttData = await ttRes.json();
      setEntries(ttData.entries || []);
      setStudentMeta(ttData.studentMeta);

      // 2. Fetch timetable configuration (working days / time slots)
      const configRes = await fetch(`${API}/timetable/engine/config`, { headers });
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData.config);
      }

      // 3. Fetch student attendance records
      const attRes = await fetch(`${API}/attendance/student/${user.id}`, { headers });
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceRecords(attData.records || []);
        setAttendanceStats(attData.subjects || []);
      }
    } catch (err: any) {
      console.error(err);
      // Fulfilling Phase 6 requirement: Do not display errors, show clean empty state instead
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Helper: map a day name to the date of that day in the current week
  const getDateOfWeekday = (dayName: string): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetIdx = days.indexOf(dayName);
    if (targetIdx === -1) return '';

    const today = new Date();
    const currentIdx = today.getDay();

    const diff = targetIdx - currentIdx;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);

    return targetDate.toISOString().split('T')[0];
  };

  // Helper: determine attendance status for a specific slot in the current week
  const getAttendanceStatus = (entry: TtEntry): {
    label: string;
    status: 'present' | 'absent' | 'pending' | 'none';
    color: string;
  } => {
    if (entry.isFree || entry.isLunch) return { label: '', status: 'none', color: '' };
    const dateStr = getDateOfWeekday(entry.day);
    if (!dateStr) return { label: 'Attendance Not Yet Taken', status: 'none', color: 'text-gray-400' };

    const match = attendanceRecords.find(
      (r) => r.date === dateStr && r.subject.toLowerCase() === entry.subjectName.toLowerCase()
    );

    if (match) {
      if (match.status === 'present' || match.status === 'late') {
        return { label: 'Present', status: 'present', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      }
      return { label: 'Absent', status: 'absent', color: 'bg-rose-50 text-rose-700 border-rose-100' };
    }

    // Check if slot time has passed
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const isPastDay = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    let isPastTime = false;
    if (entry.timeSlot?.endTime) {
      const [eh, em] = entry.timeSlot.endTime.split(':').map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      isPastTime = nowMin > (eh * 60 + em);
    }

    if (isPastDay || (isToday && isPastTime)) {
      return { label: 'Attendance Pending', status: 'pending', color: 'bg-amber-50 text-amber-700 border-amber-100' };
    }

    return { label: 'Attendance Not Yet Taken', status: 'none', color: 'bg-slate-50 text-slate-400 border-slate-100' };
  };

  // Live calculations for current/next classes
  const liveSchedule = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[nowTime.getDay()];
    const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();

    const todaySlots = entries.filter((e) => e.day === currentDay);

    const mapped = todaySlots.map((slot) => {
      if (!slot.timeSlot?.startTime || !slot.timeSlot?.endTime) return { ...slot, status: 'unknown' };
      const [sh, sm] = slot.timeSlot.startTime.split(':').map(Number);
      const [eh, em] = slot.timeSlot.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        status = 'ongoing';
      } else if (currentMinutes >= endMin) {
        status = 'completed';
      }
      return { ...slot, status, startMin, endMin };
    });

    const ongoing = mapped.find((s) => s.status === 'ongoing') || null;
    const upcoming = mapped
      .filter((s) => s.status === 'upcoming')
      .sort((a, b) => (a.startMin || 0) - (b.startMin || 0))[0] || null;

    const completedCount = mapped.filter((s) => s.status === 'completed' && !s.isFree && !s.isLunch).length;
    const remainingCount = mapped.filter((s) => s.status === 'upcoming' && !s.isFree && !s.isLunch).length;
    const totalLectures = todaySlots.filter((s) => !s.isFree && !s.isLunch).length;
    const lunchTimeSlot = todaySlots.find((s) => s.isLunch)?.timeSlot || null;

    // Free hours calculation
    const freeSlotsCount = todaySlots.filter((s) => s.isFree).length;
    // Assume each slot is 1 hour for display summary
    const freeHours = freeSlotsCount;

    return {
      ongoing,
      upcoming,
      completedCount,
      remainingCount,
      totalLectures,
      freeHours,
      lunchTime: lunchTimeSlot ? `${lunchTimeSlot.startTime} – ${lunchTimeSlot.endTime}` : 'No break',
      todaySlots: mapped,
    };
  }, [entries, nowTime]);

  // Remaining time in minutes for upcoming class
  const remainingTimeMinutes = useMemo(() => {
    if (!liveSchedule.upcoming || !liveSchedule.upcoming.timeSlot?.startTime) return 0;
    const [h, m] = liveSchedule.upcoming.timeSlot.startTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const nowMin = nowTime.getHours() * 60 + nowTime.getMinutes();
    return Math.max(0, startMin - nowMin);
  }, [liveSchedule.upcoming, nowTime]);

  // Client-side filtering & search
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          e.subjectName?.toLowerCase().includes(q) ||
          e.facultyName?.toLowerCase().includes(q) ||
          e.roomName?.toLowerCase().includes(q) ||
          e.day?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Filter Type
      if (filterType !== 'all') {
        const type = e.subjectType?.toLowerCase();
        if (filterType === 'theory' && type !== 'theory') return false;
        if (filterType === 'lab' && type !== 'lab') return false;
        if (filterType === 'tutorial' && type !== 'tutorial') return false;
      }

      // 3. Filter Day
      if (filterDay !== 'all') {
        if (e.day !== filterDay) return false;
      }

      return true;
    });
  }, [entries, searchQuery, filterType, filterDay]);

  // Group weekly slots
  const weeklyGridData = useMemo(() => {
    const days = config?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = config?.timeSlots || [];

    const grid: Record<string, Record<string, TtEntry>> = {};
    days.forEach((day: string) => {
      grid[day] = {};
    });

    filteredEntries.forEach((entry) => {
      if (grid[entry.day] !== undefined && entry.timeSlot?.label) {
        grid[entry.day][entry.timeSlot.label] = entry;
      }
    });

    return { days, timeSlots, grid };
  }, [filteredEntries, config]);

  // Display course details popup
  const handleOpenSubjectDetail = (entry: TtEntry) => {
    const stats = attendanceStats.find((s) => s.subject.toLowerCase() === entry.subjectName.toLowerCase());
    const matchedCourse = user?.enrolledCourses?.find(
      (c: any) => c.courseName?.toLowerCase() === entry.subjectName.toLowerCase()
    );

    setSelectedSubjectDetail({
      subjectName: entry.subjectName,
      subjectCode: matchedCourse?.courseCode || 'CS-' + entry.subjectName.substring(0, 3).toUpperCase(),
      facultyName: entry.facultyName || 'TBA',
      roomName: entry.roomName || 'TBA',
      lectureType: entry.subjectType,
      credits: matchedCourse?.credits || 4,
      lectureHours: matchedCourse?.lectureHours || 3,
      attendancePercentage: stats ? stats.attendancePercentage : null,
      stats: stats || null,
      upcomingClasses: entries
        .filter((e) => e.subjectName === entry.subjectName)
        .map((e) => `${e.day} @ ${e.timeSlot?.startTime} – ${e.timeSlot?.endTime}`),
    });
  };

  // Color mappings
  const getCardStyles = (type: string, isLunch: boolean, isFree: boolean) => {
    if (isLunch) return { card: 'bg-purple-50 border-l-4 border-l-purple-500 border-purple-100 text-purple-950', badge: 'bg-purple-100 text-purple-700' };
    if (isFree) return { card: 'bg-slate-50 border-l-4 border-l-slate-400 border-slate-100 text-slate-600', badge: 'bg-slate-100 text-slate-500' };

    const t = (type || '').toLowerCase();
    if (t === 'lab') return { card: 'bg-emerald-50/70 border-l-4 border-l-emerald-600 border-emerald-200 text-emerald-950 shadow-sm', badge: 'bg-emerald-100 text-emerald-800' };
    if (t === 'tutorial') return { card: 'bg-amber-50/70 border-l-4 border-l-amber-600 border-amber-200 text-amber-950 shadow-sm', badge: 'bg-amber-100 text-amber-850' };
    if (t === 'workshop' || t === 'exam') return { card: 'bg-rose-50/70 border-l-4 border-l-rose-600 border-rose-200 text-rose-950 shadow-sm', badge: 'bg-rose-100 text-rose-800' };

    return { card: 'bg-blue-50/70 border-l-4 border-l-blue-600 border-blue-200 text-blue-950 shadow-sm', badge: 'bg-blue-100 text-blue-800' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-semibold">Loading student timetable...</p>
      </div>
    );
  }

  // Fulfilling Phase 6 requirement: If timetable has not been generated, show "Your timetable has not been published yet." Do not display errors.
  if (entries.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Calendar className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-700">Timetable Unavailable</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Your timetable has not been published yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Today's Summary & Notifications (Today view only) ── */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Summary Panel */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Today's Schedule Summary</span>
                <h3 className="text-lg font-black tracking-wide mt-0.5">
                  {studentMeta?.branch || 'Department'} · Sem {studentMeta?.semester} · Sec {studentMeta?.section}
                </h3>
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Total Lectures</p>
                <p className="text-xl font-bold mt-1">{liveSchedule.totalLectures}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-bold mt-1 text-emerald-300">{liveSchedule.completedCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Remaining</p>
                <p className="text-xl font-bold mt-1 text-amber-300">{liveSchedule.remainingCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Free Hours</p>
                <p className="text-xl font-bold mt-1">{liveSchedule.freeHours} hr</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-100">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Lunch break: {liveSchedule.lunchTime}</span>
              <span className="bg-white/10 px-2.5 py-1 rounded-xl text-[10px] font-semibold">Live Synced</span>
            </div>
          </div>

          {/* Upcoming Class Notification Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Class</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              </div>
              {liveSchedule.upcoming ? (
                <>
                  <h4 className="text-sm font-extrabold text-slate-800">{liveSchedule.upcoming.subjectName}</h4>
                  <div className="space-y-2 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /> {liveSchedule.upcoming.facultyName}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {liveSchedule.upcoming.roomName}</div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {liveSchedule.upcoming.timeSlot?.startTime} – {liveSchedule.upcoming.timeSlot?.endTime}</div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No upcoming lectures today.
                </div>
              )}
            </div>

            {liveSchedule.upcoming && (
              <div className="mt-4 bg-indigo-50 border border-indigo-100/60 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold">
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>Starts in {remainingTimeMinutes} mins</span>
                </div>
                <button
                  onClick={() => handleOpenSubjectDetail(liveSchedule.upcoming!)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filters & View Tabs ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Toggle tab */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'today' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'week' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Weekly Grid
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Search box */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Subject, Room, Day..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none w-full sm:w-44"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
            <option value="tutorial">Tutorial</option>
          </select>

          {/* Weekly view day filter */}
          {activeTab === 'week' && (
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Days</option>
              {config?.workingDays?.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── DAILY TIMETABLE VIEW ── */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Today's Class Sequence</h3>
          {liveSchedule.todaySlots.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-3xl">
              No classes scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {liveSchedule.todaySlots.map((entry, idx) => {
                const isLunch = entry.isLunch || entry.subjectType === 'lunch';
                const isFree = entry.isFree || entry.subjectType === 'free';
                const styles = getCardStyles(entry.subjectType, isLunch, isFree);
                const att = getAttendanceStatus(entry);

                return (
                  <div
                    key={idx}
                    onClick={() => !isLunch && !isFree && handleOpenSubjectDetail(entry)}
                    className={`p-4 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:shadow-sm ${
                      entry.status === 'ongoing' ? 'ring-2 ring-emerald-500/25 border-emerald-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Slot time */}
                      <div className="bg-slate-50 border border-slate-100/50 p-2.5 rounded-2xl flex flex-col items-center justify-center w-24 text-center">
                        <Clock className="w-3.5 h-3.5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600 leading-none">{entry.timeSlot?.startTime}</span>
                        <span className="text-[8px] text-slate-400 mt-1 font-semibold leading-none">{entry.timeSlot?.endTime}</span>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800">
                            {isLunch ? '☕ Lunch Break' : isFree ? '— Free Slot' : entry.subjectName}
                          </h4>
                          {!isLunch && !isFree && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${styles.badge}`}>
                              {entry.subjectType}
                            </span>
                          )}
                          {entry.status === 'ongoing' && (
                            <span className="text-[8px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse border border-emerald-200">
                              Ongoing
                            </span>
                          )}
                        </div>

                        {!isLunch && !isFree && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {entry.facultyName}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {entry.roomName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attendance status */}
                    {!isLunch && !isFree && (
                      <div className="flex items-center gap-2 self-stretch sm:self-auto sm:border-l sm:border-slate-100 sm:pl-6 justify-end">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 border rounded-xl flex items-center gap-1 ${att.color}`}>
                          {att.status === 'present' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : att.status === 'absent' ? <XCircle className="w-3 h-3 text-rose-600" /> : <HelpCircle className="w-3 h-3 text-slate-400" />}
                          {att.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── WEEKLY TIMETABLE GRID VIEW ── */}
      {activeTab === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Weekly Schedule Matrix</h4>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-4 px-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-widest w-24">Day</th>
                  {weeklyGridData.timeSlots.map((slot: any, idx) => (
                    <th key={idx} className="py-3 px-2 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      <div>{slot.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">{slot.startTime} - {slot.endTime}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weeklyGridData.days.map((day) => {
                  if (filterDay !== 'all' && day !== filterDay) return null;

                  return (
                    <tr key={day} className="hover:bg-slate-50/20 transition">
                      <td className="py-4 px-4 font-bold text-slate-700 text-xs">
                        {day}
                      </td>
                      {weeklyGridData.timeSlots.map((slot: any, idx) => {
                        const entry = weeklyGridData.grid[day]?.[slot.label];
                        if (!entry) {
                          return (
                            <td key={idx} className="py-2 px-1 text-center">
                              <div className="h-full min-h-[80px] border border-dashed border-slate-100 rounded-2xl bg-slate-50/20" />
                            </td>
                          );
                        }

                        const isLunch = entry.isLunch || entry.subjectType === 'lunch';
                        const isFree = entry.isFree || entry.subjectType === 'free';
                        const styles = getCardStyles(entry.subjectType, isLunch, isFree);
                        const att = getAttendanceStatus(entry);

                        return (
                          <td key={idx} className="py-2 px-1 text-center align-middle">
                            <div
                              onClick={() => !isLunch && !isFree && handleOpenSubjectDetail(entry)}
                              className={`h-full min-h-[82px] border p-2.5 rounded-2xl flex flex-col justify-between text-left transition-all select-none hover:shadow hover:scale-[1.01] cursor-pointer ${styles.card}`}
                            >
                              <div>
                                <div className="flex justify-between items-start gap-1">
                                  <h5 className="font-bold text-[10px] leading-tight truncate w-24">
                                    {isLunch ? 'Lunch Break' : isFree ? 'Free Slot' : entry.subjectName}
                                  </h5>
                                </div>
                                {!isLunch && !isFree && (
                                  <div className="flex items-center gap-1 mt-1 text-[9px] opacity-75">
                                    <User className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span className="truncate w-20">{entry.facultyName}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between w-full mt-2">
                                {!isLunch && !isFree ? (
                                  <div className="flex items-center gap-0.5 text-[8px] font-bold opacity-80 uppercase">
                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span className="truncate w-12">{entry.roomName}</span>
                                  </div>
                                ) : (
                                  <div className="w-1" />
                                )}

                                {!isLunch && !isFree && att.status !== 'none' && (
                                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded border ${
                                    att.status === 'present'
                                      ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                                      : att.status === 'absent'
                                      ? 'bg-rose-100 border-rose-200 text-rose-800'
                                      : 'bg-amber-100 border-amber-200 text-amber-800'
                                  }`}>
                                    {att.status === 'present' ? 'P' : att.status === 'absent' ? 'A' : 'Pend'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COURSE DETAILS MODAL ── */}
      {selectedSubjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedSubjectDetail(null)}>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedSubjectDetail.subjectCode}
                </span>
                <h3 className="text-md font-black mt-1 leading-snug">{selectedSubjectDetail.subjectName}</h3>
              </div>
              <button
                onClick={() => setSelectedSubjectDetail(null)}
                className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Credits</span>
                  <p className="text-sm font-bold text-slate-800">{selectedSubjectDetail.credits} Credits</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Lecture Hours</span>
                  <p className="text-sm font-bold text-slate-800">{selectedSubjectDetail.lectureHours} hr/week</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Faculty Member</span>
                  <span className="font-bold text-slate-800">{selectedSubjectDetail.facultyName}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Classroom Location</span>
                  <span className="font-bold text-slate-800">Room {selectedSubjectDetail.roomName}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-400 font-medium">Current Attendance %</span>
                  <span className={`font-bold ${
                    selectedSubjectDetail.attendancePercentage === null
                      ? 'text-slate-500'
                      : selectedSubjectDetail.attendancePercentage >= 75
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {selectedSubjectDetail.attendancePercentage === null
                      ? 'No record'
                      : `${selectedSubjectDetail.attendancePercentage}%`}
                  </span>
                </div>
              </div>

              {/* Attendance quick summary */}
              {selectedSubjectDetail.stats && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl text-[10px] text-indigo-900 leading-relaxed">
                  📊 Class attendance stats: Enrolled lectures: <span className="font-bold">{selectedSubjectDetail.stats.total}</span> · Attended: <span className="font-bold">{selectedSubjectDetail.stats.present + selectedSubjectDetail.stats.late}</span> · Absences: <span className="font-bold text-rose-600">{selectedSubjectDetail.stats.absent}</span>
                </div>
              )}

              {/* Upcoming timetable instances */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Weekly Instances</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubjectDetail.upcomingClasses.map((item: string, i: number) => (
                    <span key={i} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-xl border border-slate-200/50">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSubjectDetail(null)}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

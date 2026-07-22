import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { isValidObjectId, resolveCourseId } from '../../lib/objectId';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ClassAnalytics,
  PastSession,
  StudentRow,
  StudentSummary,
  TimetableSlot,
} from './attendanceTypes';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getWeekdayName = (dateStr: string) =>
  WEEKDAY_NAMES[new Date(`${dateStr}T12:00:00`).getDay()];

const buildSlotsFromAssignedCourses = (courses: {
  courseId?: string;
  _id?: string;
  courseName?: string;
  courseCode?: string;
  semester?: string | number;
  department?: string;
}[]): TimetableSlot[] => {
  const dayTimeSlots = [
    { day: 'Monday', start: '09:00', end: '10:00' },
    { day: 'Monday', start: '14:00', end: '15:00' },
    { day: 'Tuesday', start: '10:00', end: '11:00' },
    { day: 'Wednesday', start: '09:00', end: '10:00' },
    { day: 'Wednesday', start: '11:00', end: '12:00' },
    { day: 'Thursday', start: '13:00', end: '14:00' },
    { day: 'Friday', start: '10:00', end: '11:00' },
    { day: 'Friday', start: '15:00', end: '16:00' },
  ];

  return courses.map((course, index) => {
    const slot = dayTimeSlots[index % dayTimeSlots.length];
    return {
      _id: String(course.courseId || course._id || `assigned-${index}`),
      subject: course.courseName || course.courseCode || `Course ${index + 1}`,
      day: slot.day,
      startTime: slot.start,
      endTime: slot.end,
      semester: Number(course.semester) || 1,
      department: course.department || 'CS',
    };
  });
};

const DEMO_TIMETABLE: TimetableSlot[] = [
  { _id: 'demo-slot-1', subject: 'Data Structures', day: 'Monday', startTime: '09:00', endTime: '10:00', semester: 3, department: 'CS' },
  { _id: 'demo-slot-2', subject: 'Database Systems', day: 'Wednesday', startTime: '11:00', endTime: '12:00', semester: 3, department: 'CS' },
  { _id: 'demo-slot-3', subject: 'Operating Systems', day: 'Friday', startTime: '14:00', endTime: '15:00', semester: 3, department: 'CS' },
];

type MarkStatus = 'present' | 'absent' | 'late';

interface TeacherCourseOption {
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
  department?: string;
}

const mapApiCourseToOption = (c: {
  _id: string;
  courseCode?: string;
  courseName?: string;
  semester?: string | number;
  department?: string;
}): TeacherCourseOption | null => {
  const courseId = resolveCourseId(c);
  if (!courseId) return null;
  const code = c.courseCode?.trim() || '';
  const name = c.courseName?.trim() || code || 'Course';
  return {
    courseId,
    courseCode: code || name,
    courseName: name,
    semester: String(c.semester ?? ''),
    department: c.department,
  };
};

const normalizeMarkStatus = (status: string): MarkStatus => {
  if (status === 'absent') return 'absent';
  if (status === 'late') return 'late';
  return 'present';
};

const statusConfig: Record<MarkStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  present: { label: 'Present', className: 'bg-emerald-500 text-white', icon: CheckCircle },
  absent: { label: 'Absent', className: 'bg-red-500 text-white', icon: XCircle },
  late: { label: 'Late', className: 'bg-amber-500 text-white', icon: Clock },
};

const riskBadge: Record<string, string> = {
  safe: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

interface Props {
  teacherId?: string;
  teacherName?: string;
  autoSelectedSlot?: {
    _id?: string;
    subject: string;
    day: string;
    startTime: string;
    endTime: string;
    semester: number;
    department: string;
    section: string;
  } | null;
}

type TabId = 'take' | 'analytics' | 'history';
type FilterId = 'all' | 'risk' | 'critical' | 'absent_today';

export default function AttendanceTaker({ teacherId, teacherName, autoSelectedSlot }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('take');
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, MarkStatus>>({});
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [insights, setInsights] = useState<{ riskyCount: number; criticalCount: number; message: string; trendMessage: string } | null>(null);
  const [pastRecords, setPastRecords] = useState<PastSession[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [error, setError] = useState('');
  const [editSession, setEditSession] = useState<PastSession | null>(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [useDemoStudents, setUseDemoStudents] = useState(false);
  const [usingFallbackSchedule, setUsingFallbackSchedule] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const userEditedRef = useRef(false);
  const reminderShownRef = useRef<string | null>(null);
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [sectionOptions, setSectionOptions] = useState<string[]>(['A', 'B', 'C']);
  const [selectedSection, setSelectedSection] = useState('A');

  const selectedCourse = useMemo(
    () => {
      if (autoSelectedSlot) {
        return {
          courseId: autoSelectedSlot._id || 'temp-id',
          courseCode: autoSelectedSlot.subject,
          courseName: autoSelectedSlot.subject,
          semester: String(autoSelectedSlot.semester),
          department: autoSelectedSlot.department,
        };
      }
      return teacherCourses.find((c) => c.courseId === selectedCourseId) || null;
    },
    [teacherCourses, selectedCourseId, autoSelectedSlot]
  );

  const draftKey = teacherId && selectedCourseId && date
    ? `attendance_draft_${teacherId}_${selectedCourseId}_${date}`
    : '';

  useEffect(() => {
    axios
      .get(`${API}/timetable/engine/config`)
      .then(({ data }) => {
        const sections = new Set<string>();
        (data.config?.branches || []).forEach((b: { years: { sections: string[] }[] }) => {
          b.years.forEach((y) => y.sections.forEach((s) => sections.add(s)));
        });
        const list = Array.from(sections).sort();
        if (list.length) {
          setSectionOptions(list);
          setSelectedSection((prev) => (prev && list.includes(prev) ? prev : list[0]));
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    axios
      .get(`${API}/timetable/teacher/${teacherId}`)
      .then(({ data }) => {
        let slots: TimetableSlot[] = data.slots || [];
        const assignedValid = (user?.assignedCourses || []).filter((c) => resolveCourseId(c));
        if (slots.length === 0 && assignedValid.length) {
          slots = buildSlotsFromAssignedCourses(assignedValid);
          setUsingFallbackSchedule(true);
        } else if (slots.length === 0) {
          slots = DEMO_TIMETABLE;
          setUsingFallbackSchedule(true);
        } else {
          setUsingFallbackSchedule(false);
        }
        setTimetableSlots(slots);
      })
      .catch(() => {
        const assignedValid = (user?.assignedCourses || []).filter((c) => resolveCourseId(c));
        const fallback = assignedValid.length
          ? buildSlotsFromAssignedCourses(assignedValid)
          : DEMO_TIMETABLE;
        setTimetableSlots(fallback);
        setUsingFallbackSchedule(true);
        setError('');
      });
  }, [teacherId, user?.assignedCourses]);

  useEffect(() => {
    if (!teacherId) {
      setCoursesLoading(false);
      return;
    }

    let cancelled = false;

    const coursesFromAuth = (): TeacherCourseOption[] =>
      (user?.assignedCourses || [])
        .map((c) => {
          const courseId = resolveCourseId(c);
          if (!courseId) return null;
          const code = c.courseCode?.trim() || '';
          const name = c.courseName?.trim() || code || 'Course';
          return {
            courseId,
            courseCode: code || name,
            courseName: name,
            semester: String(c.semester ?? ''),
          };
        })
        .filter((c): c is TeacherCourseOption => c !== null);

    const applyCourses = (list: TeacherCourseOption[]) => {
      if (cancelled) return;
      const valid = list.filter((c) => isValidObjectId(c.courseId));
      setTeacherCourses(valid);
      setSelectedCourseId((prev) => {
        if (prev && valid.some((c) => c.courseId === prev)) return prev;
        return valid[0]?.courseId ?? '';
      });
      if (!valid.length) {
        setError('No valid assigned courses. Ask admin to assign courses to your account.');
      }
      setCoursesLoading(false);
    };

    const token =
      user?.token ||
      (typeof localStorage !== 'undefined'
        ? JSON.parse(localStorage.getItem('lms_user') || '{}')?.token
        : null);

    if (token) {
      axios
        .get(`${API}/teachers/me/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data }) => {
          const fromApi = (data.data || [])
            .map(mapApiCourseToOption)
            .filter((c): c is TeacherCourseOption => c !== null);
          applyCourses(fromApi.length ? fromApi : coursesFromAuth());
        })
        .catch(() => applyCourses(coursesFromAuth()));
    } else {
      applyCourses(coursesFromAuth());
    }

    return () => {
      cancelled = true;
    };
  }, [teacherId, user?.assignedCourses, user?.token]);

  useEffect(() => {
    if (autoSelectedSlot) {
      setSelectedSlot({
        _id: autoSelectedSlot._id || 'temp-slot-id',
        subject: autoSelectedSlot.subject,
        day: autoSelectedSlot.day,
        startTime: autoSelectedSlot.startTime,
        endTime: autoSelectedSlot.endTime,
        semester: autoSelectedSlot.semester,
        department: autoSelectedSlot.department,
        section: autoSelectedSlot.section || 'A',
      });
      setSelectedCourseId(autoSelectedSlot._id || 'temp-slot-id');
      if (autoSelectedSlot.section) {
        setSelectedSection(autoSelectedSlot.section);
      }
    } else if (selectedCourse && timetableSlots.length === 0) {
      // Keep loading
    } else if (selectedCourse) {
      const match = timetableSlots.find((s) => s.subject === selectedCourse.courseName);
      if (match) setSelectedSlot(match);
    }
  }, [selectedCourse, timetableSlots, autoSelectedSlot]);

  const loadStudentsAndSession = useCallback(async () => {
    if (!teacherId || !selectedCourseId) return;

    if (!isValidObjectId(selectedCourseId) && !autoSelectedSlot) {
      setStudents([]);
      setAttendance({});
      setUseDemoStudents(false);
      setError('Invalid course selected. Choose another course from the dropdown.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    userEditedRef.current = false;

    const subjectName = selectedCourse?.courseName || selectedSlot?.subject;
    if (!subjectName) {
      setLoading(false);
      return;
    }

    const currentSlot = selectedSlot || (autoSelectedSlot ? {
      department: autoSelectedSlot.department,
      semester: autoSelectedSlot.semester,
      section: autoSelectedSlot.section || 'A'
    } : null);

    try {
      let data;
      if (currentSlot && currentSlot.department && currentSlot.semester) {
        const branch = currentSlot.department;
        const sem = currentSlot.semester;
        const sec = autoSelectedSlot?.section || selectedSection || 'A';
        const res = await axios.get(`${API}/attendance/students-by-section`, {
          params: { branch, semester: sem, section: sec },
        });
        data = res.data;
      } else {
        const res = await axios.get(`${API}/attendance/students`, {
          params: {
            courseId: selectedCourseId,
            teacherId,
            section: selectedSection || undefined,
            semester: currentSlot?.semester,
            department: currentSlot?.department,
          },
        });
        data = res.data;
      }

      if (!data.success) {
        setError(data.message || 'Could not load students for this course.');
        setStudents([]);
        setUseDemoStudents(false);
        setAttendance({});
        setSessionExists(false);
        return;
      }

      const studs: StudentRow[] = (data.students || []).filter((s: StudentRow) =>
        isValidObjectId(s._id),
      );
      setUseDemoStudents(false);
      setStudents(studs);

      if (!studs.length) {
        setError(
          'No approved students enrolled in this course. Admin must enroll students before you can mark attendance.',
        );
      }

      const init: Record<string, MarkStatus> = {};
      studs.forEach((s) => {
        init[String(s._id)] = 'present';
      });

      try {
        const sessionRes = await axios.get(`${API}/attendance/session`, {
          params: { date, subject: subjectName, teacherId },
        });
        if (sessionRes.data.session?.records?.length) {
          sessionRes.data.session.records.forEach(
            (r: { studentId: string; status: string }) => {
              const sid = String(r.studentId);
              if (init[sid] !== undefined) init[sid] = normalizeMarkStatus(r.status);
            },
          );
          setSessionExists(true);
          setIsDraft(false);
          setShowReminderBanner(false);
          reminderShownRef.current = null;
        } else {
          setSessionExists(false);
          const draft = draftKey ? localStorage.getItem(draftKey) : null;
          if (draft) {
            const parsed = JSON.parse(draft) as Record<string, string>;
            Object.keys(parsed).forEach((id) => {
              if (init[id] !== undefined) init[id] = normalizeMarkStatus(parsed[id]);
            });
            setIsDraft(true);
          }
        }
      } catch {
        setSessionExists(false);
      }

      setAttendance(init);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ||
          'Could not load students. Check course assignment and try again.'
        : 'Could not load students.';
      setError(msg);
      setStudents([]);
      setUseDemoStudents(false);
      setAttendance({});
      setSessionExists(false);
    } finally {
      setLoading(false);
    }
  }, [selectedSlot, selectedCourse, selectedCourseId, selectedSection, teacherId, date, draftKey]);

  useEffect(() => {
    loadStudentsAndSession();
  }, [loadStudentsAndSession]);

  const loadAnalytics = useCallback(async () => {
    if (!teacherId) return;
    setAnalyticsLoading(true);
    try {
      const { data } = await axios.get(`${API}/attendance/teacher/${teacherId}/analytics`, {
        params: { subject: selectedSlot?.subject },
      });
      if (data.success) {
        setClassAnalytics(data.data.classAnalytics);
        setSummaries(data.data.students || []);
        setInsights(data.data.insights);
      }
    } catch {
      setClassAnalytics(null);
      setSummaries([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [teacherId, selectedSlot?.subject]);

  const loadHistory = useCallback(async () => {
    if (!teacherId) return;
    try {
      const { data } = await axios.get(`${API}/attendance/teacher/${teacherId}`);
      setPastRecords(data.records || []);
    } catch {
      setPastRecords([]);
    }
  }, [teacherId]);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
    if (tab === 'history') loadHistory();
  }, [tab, loadAnalytics, loadHistory]);

  const setStudentStatus = (id: string, status: MarkStatus) => {
    userEditedRef.current = true;
    setAttendance((prev) => ({ ...prev, [String(id)]: status }));
    setSaved(false);
    setIsDraft(true);
  };

  const markAll = (status: MarkStatus) => {
    if (students.length === 0) return;
    userEditedRef.current = true;
    const next: Record<string, MarkStatus> = {};
    students.forEach((s) => {
      next[String(s._id)] = status;
    });
    setAttendance(next);
    setIsDraft(true);
    setSaved(false);
  };

  const resetAttendance = () => markAll('present');

  const saveDraft = () => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, JSON.stringify(attendance));
    setIsDraft(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const submitAttendance = async (isUpdate = false) => {
    if (!teacherId || !selectedCourseId) return;
    if (!isValidObjectId(selectedCourseId) && !autoSelectedSlot) {
      setError('Invalid course. Select a course from the dropdown.');
      return;
    }
    const subjectName = selectedCourse?.courseName || selectedSlot?.subject;
    if (!subjectName) return;

    const validStudents = students.filter((s) => isValidObjectId(s._id));
    if (!validStudents.length) {
      setError('Cannot save: no enrolled students in this course.');
      toast.error('No enrolled students to save.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const records = validStudents.map((s) => ({
        studentId: s._id,
        studentName: s.name,
        status: getStatus(s._id),
      }));

      const payload: Record<string, unknown> = {
        date,
        subject: subjectName,
        courseId: isValidObjectId(selectedCourseId) ? selectedCourseId : undefined,
        teacherId,
        teacherName,
        section: autoSelectedSlot?.section || selectedSection || undefined,
        records,
        isDraft: false,
      };
      if (selectedSlot?._id && isValidObjectId(selectedSlot._id) && selectedSlot._id !== 'temp-slot-id') {
        payload.timetableSlotId = selectedSlot._id;
      }

      const { data } = await axios.post(`${API}/attendance/mark`, payload);
      if (data.success) {
        setSaved(true);
        setSessionExists(true);
        setIsDraft(false);
        setShowReminderBanner(false);
        reminderShownRef.current = null;
        if (draftKey) localStorage.removeItem(draftKey);
        toast.success(isUpdate ? 'Attendance updated' : 'Attendance saved');

        if (autoSelectedSlot && autoSelectedSlot._id && isValidObjectId(autoSelectedSlot._id)) {
          try {
            await axios.patch(`${API}/teachers/schedule/attendance-slots/${autoSelectedSlot._id}/status`, {
              status: 'completed',
              attendanceRecordId: data.attendance?._id || data.session?._id,
            });
          } catch (slotErr) {
            console.error('Failed to sync slot status:', slotErr);
          }
        }

        setTimeout(() => setSaved(false), 3000);
        if (isUpdate) setConfirmUpdate(false);
        if (tab === 'analytics') loadAnalytics();
      } else {
        const msg = data.message || 'Failed to save attendance.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message || 'Failed to save attendance.'
        : 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== 'take' || sessionExists || !selectedSlot?.endTime || !date) {
      setShowReminderBanner(false);
      return;
    }

    const checkReminder = () => {
      const [h, m] = selectedSlot.endTime.split(':').map(Number);
      const end = new Date(`${date}T00:00:00`);
      end.setHours(h ?? 0, m ?? 0, 0, 0);
      const msLeft = end.getTime() - Date.now();
      const fiveMin = 5 * 60 * 1000;
      const inWindow = msLeft > 0 && msLeft <= fiveMin;
      setShowReminderBanner(inWindow);

      const key = `${date}_${selectedSlot._id}_${teacherId}`;
      if (inWindow && reminderShownRef.current !== key) {
        reminderShownRef.current = key;
        toast.warning('Attendance not submitted for this session.', {
          description: 'Please mark attendance before class ends.',
          id: `attendance-reminder-${key}`,
        });
      }
    };

    checkReminder();
    const timer = window.setInterval(checkReminder, 30_000);
    return () => window.clearInterval(timer);
  }, [tab, sessionExists, selectedSlot, date, teacherId]);

  const openEditSession = (session: PastSession) => {
    setEditSession(session);
    const course = teacherCourses.find((c) => c.courseName === session.subject);
    if (course) setSelectedCourseId(course.courseId);
    setSelectedSlot(
      timetableSlots.find((s) => s.subject === session.subject) || {
        _id: 'edit',
        subject: session.subject,
        day: '',
        startTime: '',
        endTime: '',
        semester: 0,
        department: '',
      }
    );
    setDate(session.date);
    const mapped: Record<string, MarkStatus> = {};
    session.records.forEach((r, i) => {
      const id = r.studentId || students[i]?._id || `edit-${i}`;
      mapped[id] = normalizeMarkStatus(r.status);
    });
    setAttendance(mapped);
    setTab('take');
  };

  const summaryMap = useMemo(() => {
    const map = new Map<string, StudentSummary>();
    summaries.forEach((s) => map.set(s.studentId, s));
    return map;
  }, [summaries]);

  const getStatus = (studentId: string): MarkStatus =>
    attendance[String(studentId)] || 'present';

  const todayCounts = useMemo(() => {
    const present = students.filter((s) => getStatus(s._id) === 'present').length;
    const absent = students.filter((s) => getStatus(s._id) === 'absent').length;
    const late = students.filter((s) => getStatus(s._id) === 'late').length;
    const total = students.length;
    const attended = present + late;
    const pct = total > 0 ? ((attended / total) * 100).toFixed(1) : '0';
    return { present, absent, late, total, pct };
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    let list = [...students];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q)
      );
    }
    if (filter === 'risk') {
      list = list.filter((s) => {
        const sum = summaryMap.get(s._id);
        return sum && sum.riskLevel !== 'safe';
      });
    }
    if (filter === 'critical') {
      list = list.filter((s) => summaryMap.get(s._id)?.riskLevel === 'critical');
    }
    if (filter === 'absent_today') {
      list = list.filter((s) => getStatus(s._id) === 'absent');
    }
    list.sort((a, b) => {
      const pa = summaryMap.get(a._id)?.attendancePercentage ?? 100;
      const pb = summaryMap.get(b._id)?.attendancePercentage ?? 100;
      return sortAsc ? pa - pb : pb - pa;
    });
    return list;
  }, [students, search, filter, summaryMap, attendance, sortAsc]);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedWeekday = getWeekdayName(date);

  const groupedSlots = useMemo(() => {
    const g: Record<string, TimetableSlot[]> = {};
    timetableSlots.forEach((slot) => {
      if (!g[slot.day]) g[slot.day] = [];
      g[slot.day].push(slot);
    });
    Object.keys(g).forEach((day) => {
      g[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return g;
  }, [timetableSlots]);

  const slotsOnSelectedDate = useMemo(
    () => timetableSlots.filter((slot) => slot.day === selectedWeekday),
    [timetableSlots, selectedWeekday]
  );

  const renderSlotButton = (slot: TimetableSlot, highlightToday?: boolean) => (
    <button
      key={slot._id}
      type="button"
      onClick={() => {
        userEditedRef.current = false;
        setSelectedSlot(slot);
        const course = teacherCourses.find((c) => c.courseName === slot.subject);
        if (course) setSelectedCourseId(course.courseId);
        setSaved(false);
      }}
      className={`mb-1.5 w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
        selectedSlot?._id === slot._id
          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-300'
          : highlightToday
            ? 'border-indigo-300 bg-indigo-50/80 hover:border-emerald-400'
            : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{slot.subject}</p>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {slot.day}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <Clock className="h-3 w-3" />
        {slot.startTime} – {slot.endTime}
      </p>
      <p className="text-[10px] text-slate-400">
        Sem {slot.semester} · {slot.department}
      </p>
    </button>
  );

  const riskyCount = summaries.filter((s) => s.riskLevel !== 'safe').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance Management</h2>
          <p className="text-sm text-slate-500">
            Mark attendance per course, day, and time slot — switch classes anytime from the schedule
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {([
            { id: 'take' as const, label: 'Take Attendance', icon: Users },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'history' as const, label: 'History & Edit', icon: History },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {usingFallbackSchedule && tab === 'take' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Schedule built from your assigned courses. Admin timetable will replace this when available.
        </div>
      )}

      {showReminderBanner && tab === 'take' && !sessionExists && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Attendance not submitted for this session. Please mark attendance before class ends.
        </div>
      )}

      {!coursesLoading && students.length === 0 && !loading && tab === 'take' && isValidObjectId(selectedCourseId) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          No enrolled students for this course. Admin must enroll approved students before you can save attendance.
        </div>
      )}

      {tab === 'take' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-3">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  Class & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">Course</label>
                  {teacherCourses.length === 0 ? (
                    <p className="mt-2 text-xs text-amber-700">No assigned courses. Contact admin to assign courses.</p>
                  ) : (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        userEditedRef.current = false;
                        setSelectedCourseId(e.target.value);
                        setSaved(false);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {teacherCourses.map((c) => (
                        <option key={c.courseId} value={c.courseId}>
                          {c.courseName} ({c.courseCode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      userEditedRef.current = false;
                      setSelectedSection(e.target.value);
                      setSaved(false);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {sectionOptions.map((sec) => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">Attendance sheet shows students in this section only.</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-slate-500">Attendance Date</label>
                  <Input
                    type="date"
                    value={date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      userEditedRef.current = false;
                      setDate(e.target.value);
                    }}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-indigo-600 font-medium">{selectedWeekday}</p>
                </div>

                {timetableSlots.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No classes assigned yet.</p>
                ) : (
                  <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Classes on {selectedWeekday} ({slotsOnSelectedDate.length})
                      </p>
                      {slotsOnSelectedDate.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                          No lecture scheduled this weekday. Pick any class below or change the date.
                        </p>
                      ) : (
                        slotsOnSelectedDate.map((slot) => renderSlotButton(slot, true))
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Full weekly schedule ({timetableSlots.length} slots)
                      </p>
                      {dayOrder.filter((d) => groupedSlots[d]).map((day) => (
                        <div key={day} className="mb-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase text-slate-400">{day}</p>
                          {groupedSlots[day].map((slot) => renderSlotButton(slot, slot.day === selectedWeekday))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-9">
            {!selectedCourseId ? (
              <Card className="flex h-64 items-center justify-center shadow-sm">
                <div className="text-center text-slate-400">
                  <Users className="mx-auto mb-2 h-10 w-10 opacity-30" />
                  <p className="text-sm">Select a course and date to begin</p>
                </div>
              </Card>
            ) : loading ? (
              <Card className="flex h-64 items-center justify-center gap-2 text-slate-400 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading students...
              </Card>
            ) : (
              <Card className="overflow-hidden shadow-sm">
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{selectedCourse?.courseName || selectedSlot?.subject}</h3>
                      <p className="text-xs text-slate-500">
                        {date}
                        {selectedSlot
                          ? ` (${selectedSlot.day}) · ${selectedSlot.startTime}–${selectedSlot.endTime} · ${selectedSlot.department} · Sem ${selectedSlot.semester}`
                          : selectedCourse
                            ? ` · ${selectedCourse.courseCode} · Sem ${selectedCourse.semester}`
                            : ''}
                        {sessionExists && (
                          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Previously marked</span>
                        )}
                        {isDraft && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">Draft</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-emerald-600">Present: {todayCounts.present}</span>
                      <span className="font-semibold text-amber-600">Late: {todayCounts.late}</span>
                      <span className="font-semibold text-red-500">Absent: {todayCounts.absent}</span>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700">
                        {todayCounts.pct}% class rate
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => markAll('present')}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <CheckCircle className="mr-1 inline h-3.5 w-3.5" />
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => markAll('absent')}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                    >
                      <XCircle className="mr-1 inline h-3.5 w-3.5" />
                      Mark All Absent
                    </button>
                    <button
                      type="button"
                      onClick={resetAttendance}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                      Reset to Present
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Save className="mr-1 inline h-3.5 w-3.5" />
                      Save Draft
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Tip: mark each student as <strong>Present</strong>, <strong>Late</strong>, or <strong>Absent</strong>.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="relative min-w-[200px] flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search name or roll no..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {(['all', 'risk', 'critical', 'absent_today'] as FilterId[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                          filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSortAsc(!sortAsc)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      Sort % {sortAsc ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">No students in this section.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3">Student</th>
                          <th className="px-3 py-3">Roll No</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Att. %</th>
                          <th className="px-3 py-3">Last 7</th>
                          <th className="px-3 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map((student) => {
                          const status = getStatus(student._id);
                          const sum = summaryMap.get(student._id);
                          return (
                            <tr key={student._id} className="hover:bg-slate-50/80">
                              <td className="px-5 py-3">
                                <p className="font-medium text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-400">{student.email}</p>
                              </td>
                              <td className="px-3 py-3 font-mono text-xs text-slate-600">
                                {student.studentId || '—'}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                    status === 'present'
                                      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                      : status === 'late'
                                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                                        : 'bg-red-100 text-red-800 ring-1 ring-red-300'
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`font-semibold ${
                                    (sum?.attendancePercentage ?? 100) < 65
                                      ? 'text-red-600'
                                      : (sum?.attendancePercentage ?? 100) < 75
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                  }`}
                                >
                                  {sum ? `${sum.attendancePercentage}%` : '—'}
                                </span>
                                {sum && sum.riskLevel !== 'safe' && (
                                  <span className={`ml-1 rounded px-1 text-[10px] font-bold ${riskBadge[sum.riskLevel]}`}>
                                    {sum.riskLevel}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-0.5">
                                  {(sum?.recentTrend || []).slice(-7).map((t, i) => (
                                    <span
                                      key={`${student._id}-${i}`}
                                      className={`h-2 w-2 rounded-full ${t.attended ? 'bg-emerald-500' : 'bg-red-400'}`}
                                      title={`${t.date}: ${t.status}`}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {(['present', 'late', 'absent'] as const).map((s) => {
                                    const active = status === s;
                                    const sc = statusConfig[s];
                                    const SIcon = sc.icon;
                                    return (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setStudentStatus(student._id, s);
                                        }}
                                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                                          active
                                            ? `${sc.className} border-transparent shadow-sm`
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title={`Mark ${sc.label}`}
                                      >
                                        <SIcon className="h-3.5 w-3.5" />
                                        {sc.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                  <div className="text-sm text-slate-600">
                    {saved && (
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        {sessionExists ? 'Attendance updated!' : 'Attendance submitted!'}
                      </span>
                    )}
                    {!saved && riskyCount > 0 && (
                      <span className="text-amber-700">{riskyCount} students at attendance risk</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    disabled={saving || students.length === 0 || !isValidObjectId(selectedCourseId)}
                    onClick={() => (sessionExists ? setConfirmUpdate(true) : submitAttendance())}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {sessionExists ? 'Update Attendance' : 'Submit Attendance'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading analytics...
            </div>
          ) : !classAnalytics ? (
            <Card className="py-12 text-center text-slate-500 shadow-sm">
              <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-30" />
              <p>Mark attendance to see analytics, or select a course on the Take tab.</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Sessions Conducted', value: classAnalytics.totalSessions },
                  { label: 'Average Attendance', value: `${classAnalytics.averageAttendance}%` },
                  { label: 'Highest', value: `${classAnalytics.highestAttendance}%` },
                  { label: 'At Risk', value: insights?.riskyCount ?? 0 },
                ].map((item) => (
                  <Card key={item.label} className="shadow-sm">
                    <CardContent className="pt-6">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {insights && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <strong>Insight:</strong> {insights.message}
                  </div>
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
                    <strong>Trend:</strong> {insights.trendMessage}
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Attendance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={classAnalytics.weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Course-wise Attendance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classAnalytics.courseWise}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="attendancePercentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Students at Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  {summaries.filter((s) => s.riskLevel !== 'safe').length === 0 ? (
                    <p className="text-sm text-slate-500">No students below 75% in selected scope.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {summaries
                        .filter((s) => s.riskLevel !== 'safe')
                        .map((s) => (
                          <div
                            key={s.studentId}
                            className={`rounded-xl border p-4 ${
                              s.riskLevel === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{s.studentName}</p>
                            <p className="text-2xl font-bold">{s.attendancePercentage}%</p>
                            <p className="mt-1 text-xs text-slate-600">
                              Present {s.present} · Absent {s.absent}
                            </p>
                            {s.classesNeededFor75 > 0 && (
                              <p className="mt-2 text-xs font-medium text-red-700">
                                Needs {s.classesNeededFor75} more classes for 75%
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Past Sessions — Edit & Fix Discrepancies</CardTitle>
          </CardHeader>
          <CardContent>
            {pastRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <History className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No attendance records yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pastRecords.map((session, i) => {
                  const p = session.records.filter((r) => r.status === 'present' || r.status === 'late').length;
                  const total = session.records.length;
                  const pct = total > 0 ? ((p / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={session._id || i} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{session.subject}</p>
                        <p className="text-xs text-slate-500">{session.date}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-emerald-600">{pct}% attendance</span>
                        <span className="text-slate-500">{total} students</span>
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditSession(session)}>
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmUpdate} onOpenChange={setConfirmUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update attendance?</DialogTitle>
            <DialogDescription>
              This will overwrite the existing record for {selectedSlot?.subject} on {date}. Use this to fix discrepancies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmUpdate(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => submitAttendance(true)} disabled={saving}>
              {saving ? 'Updating...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const MIN_REQUIRED_PERCENTAGE = 75;

const isValidObjectId = (id) => {
  if (id == null) return false;
  const s = String(id).trim();
  if (!s || s === 'undefined' || s === 'null') return false;
  return mongoose.Types.ObjectId.isValid(s);
};

const resolveTimetableSlotId = (raw) => {
  if (!raw) return null;
  const id = String(raw).trim();
  return isValidObjectId(id) ? id : null;
};

const toRiskLevel = (percentage) => {
  if (percentage >= 75) return 'safe';
  if (percentage >= 65) return 'warning';
  return 'critical';
};

const calculateSafeLeavesRemaining = (presentCount, totalClasses, minimumPercentage = MIN_REQUIRED_PERCENTAGE) => {
  if (totalClasses === 0) return 0;
  const maximumAllowedTotal = Math.floor((presentCount * 100) / minimumPercentage);
  return Math.max(0, maximumAllowedTotal - totalClasses);
};

const calculateClassesNeededForTarget = (presentCount, totalClasses, targetPercentage = MIN_REQUIRED_PERCENTAGE) => {
  if (totalClasses === 0) return 0;
  const currentPercentage = (presentCount / totalClasses) * 100;
  if (currentPercentage >= targetPercentage) return 0;
  const numerator = (targetPercentage * totalClasses) - (100 * presentCount);
  const denominator = 100 - targetPercentage;
  return Math.max(0, Math.ceil(numerator / denominator));
};

const calculatePredictedAttendance = (presentCount, totalClasses, futureClasses = 6) => {
  if (totalClasses === 0) return 0;
  const rate = Math.max(0.3, Math.min(1, presentCount / totalClasses));
  const expectedFuturePresents = Math.round(futureClasses * rate);
  const predicted = ((presentCount + expectedFuturePresents) / (totalClasses + futureClasses)) * 100;
  return Number(predicted.toFixed(2));
};

const buildStudentSummary = (studentId, studentName, records) => {
  let present = 0;
  let absent = 0;
  let late = 0;

  records.forEach((session) => {
    const entry = session.records.find((r) => String(r.studentId) === String(studentId));
    if (!entry) return;
    if (entry.status === 'present') present += 1;
    else if (entry.status === 'late') late += 1;
    else absent += 1;
  });

  const total = present + absent + late;
  const effectivePresent = present + late;
  const attendancePercentage = total > 0 ? Number(((effectivePresent / total) * 100).toFixed(2)) : 0;

  const recentTrend = records
    .slice(0, 7)
    .reverse()
    .map((session) => {
      const entry = session.records.find((r) => String(r.studentId) === String(studentId));
      const status = entry?.status || 'absent';
      return {
        date: session.date,
        status,
        attended: status === 'present' || status === 'late',
      };
    });

  return {
    studentId: String(studentId),
    studentName,
    present,
    absent,
    late,
    total,
    attendancePercentage,
    riskLevel: toRiskLevel(attendancePercentage),
    predictedAttendance: calculatePredictedAttendance(effectivePresent, total),
    safeLeavesRemaining: calculateSafeLeavesRemaining(effectivePresent, total),
    classesNeededFor75: calculateClassesNeededForTarget(effectivePresent, total),
    recentTrend,
  };
};

const buildClassAnalytics = (sessions, subjectFilter) => {
  const filtered = subjectFilter ? sessions.filter((s) => s.subject === subjectFilter) : sessions;
  const totalSessions = filtered.length;

  let todayPresent = 0;
  let todayAbsent = 0;
  let todayTotal = 0;
  const today = new Date().toISOString().split('T')[0];
  const todaySession = filtered.find((s) => s.date === today);
  if (todaySession) {
    todaySession.records.forEach((r) => {
      todayTotal += 1;
      if (r.status === 'present' || r.status === 'late') todayPresent += 1;
      else todayAbsent += 1;
    });
  }

  const todayPercentage = todayTotal > 0
    ? Number(((todayPresent / todayTotal) * 100).toFixed(2))
    : 0;

  const weeklyMap = {};
  filtered.forEach((session) => {
    const weekKey = session.date.slice(0, 7);
    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { present: 0, total: 0, label: weekKey };
    session.records.forEach((r) => {
      weeklyMap[weekKey].total += 1;
      if (r.status === 'present' || r.status === 'late') weeklyMap[weekKey].present += 1;
    });
  });

  const weeklyTrend = Object.values(weeklyMap)
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-6)
    .map((w) => ({
      week: w.label,
      attendance: w.total > 0 ? Number(((w.present / w.total) * 100).toFixed(1)) : 0,
    }));

  const subjectStats = {};
  filtered.forEach((session) => {
    if (!subjectStats[session.subject]) {
      subjectStats[session.subject] = { subject: session.subject, sessions: 0, present: 0, total: 0 };
    }
    subjectStats[session.subject].sessions += 1;
    session.records.forEach((r) => {
      subjectStats[session.subject].total += 1;
      if (r.status === 'present' || r.status === 'late') subjectStats[session.subject].present += 1;
    });
  });

  const courseWise = Object.values(subjectStats).map((s) => ({
    subject: s.subject,
    sessions: s.sessions,
    attendancePercentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(2)) : 0,
  }));

  const allPercentages = courseWise.map((c) => c.attendancePercentage).filter((p) => p > 0);
  const averageAttendance = allPercentages.length > 0
    ? Number((allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length).toFixed(2))
    : 0;

  return {
    totalSessions,
    averageAttendance,
    highestAttendance: allPercentages.length ? Math.max(...allPercentages) : 0,
    lowestAttendance: allPercentages.length ? Math.min(...allPercentages) : 0,
    todayPercentage,
    todayPresent,
    todayAbsent,
    todayLate: 0,
    weeklyTrend,
    courseWise,
  };
};

const mapStudentRow = (s) => ({
  _id: s._id,
  name: s.name,
  email: s.email,
  studentId: s.studentId,
  department: s.department,
  semester: s.semester,
  section: s.section || null,
});

const teacherOwnsCourse = async (teacherId, courseId) => {
  if (!isValidObjectId(teacherId)) {
    return { ok: false, status: 400, message: 'Invalid teacher id.' };
  }
  if (!isValidObjectId(courseId)) {
    return { ok: false, status: 400, message: 'Invalid course id. Select a course assigned by admin.' };
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return { ok: false, status: 404, message: 'Course not found' };
  }

  if (course.teacher && String(course.teacher) === String(teacherId)) {
    return { ok: true, course };
  }

  const teacher = await Teacher.findById(teacherId).lean();
  const assigned = teacher?.assignedCourses?.some(
    (entry) => entry?.courseId && String(entry.courseId) === String(courseId)
  );

  if (assigned) {
    return { ok: true, course };
  }

  return {
    ok: false,
    status: 403,
    message: 'You are not authorized to manage attendance for this course',
  };
};

exports.getStudents = async (req, res) => {
  try {
    const { semester, department, courseId, teacherId, section } = req.query;

    if (courseId && teacherId) {
      if (!isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid courseId. Reload the page and pick a course from the dropdown.',
        });
      }
      if (!isValidObjectId(teacherId)) {
        return res.status(400).json({ success: false, message: 'Invalid teacher id.' });
      }

      const access = await teacherOwnsCourse(teacherId, courseId);
      if (!access.ok) {
        return res.status(access.status).json({ success: false, message: access.message });
      }

      const course = await Course.findById(courseId)
        .populate('enrolledStudents', '_id name email studentId department semester section approvalStatus')
        .lean();

      let enrolled = (course?.enrolledStudents || [])
        .filter((s) => s && s._id && s.approvalStatus === 'approved');

      if (section) {
        enrolled = enrolled.filter((s) => String(s.section || '') === String(section));
      } else if (course?.section) {
        enrolled = enrolled.filter((s) => String(s.section || '') === String(course.section));
      }

      const students = enrolled.map(mapStudentRow);

      return res.json({
        success: true,
        students,
        course: {
          courseId: course._id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          department: course.department,
          semester: course.semester,
        },
      });
    }

    const filter = { approvalStatus: 'approved' };
    if (semester) filter.semester = String(semester);
    if (department) filter.department = department;

    const students = await Student.find(filter)
      .select('_id name email semester department studentId')
      .lean();

    res.json({ success: true, students: students.map(mapStudentRow) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitAttendance = async (req, res) => {
  try {
    const {
      date,
      subject,
      courseId,
      timetableSlotId,
      teacherId,
      teacherName,
      records,
    } = req.body;

    if (!date || !teacherId || !records?.length) {
      return res.status(400).json({
        success: false,
        message: 'date, teacherId, and records are required.',
      });
    }

    if (!isValidObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher id.' });
    }

    let resolvedSubject = subject;
    let resolvedCourseId = courseId || null;

    if (courseId) {
      if (!isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course id. Select a valid assigned course.',
        });
      }
      const access = await teacherOwnsCourse(teacherId, courseId);
      if (!access.ok) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
      resolvedSubject = access.course.courseName;
      resolvedCourseId = access.course._id;
    }

    if (!resolvedSubject) {
      return res.status(400).json({
        success: false,
        message: 'subject or courseId is required.',
      });
    }

    const validRecords = records.filter(
      (r) => r.studentId && isValidObjectId(r.studentId),
    );
    if (validRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student records. Enroll approved students in this course first.',
      });
    }

    const slotId = resolveTimetableSlotId(timetableSlotId);

    let attendance = await Attendance.findOne({
      date,
      subject: resolvedSubject,
      teacherId,
    });
    const wasUpdate = Boolean(attendance);

    if (attendance) {
      attendance.records = validRecords;
      if (slotId) attendance.timetableSlotId = slotId;
      if (teacherName) attendance.teacherName = teacherName;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        date,
        subject: resolvedSubject,
        timetableSlotId: slotId,
        teacherId,
        teacherName,
        records: validRecords,
      });
    }

    res.status(wasUpdate ? 200 : 201).json({
      success: true,
      message: wasUpdate ? 'Attendance updated successfully' : 'Attendance submitted successfully',
      attendance,
      courseId: resolvedCourseId,
      subject: resolvedSubject,
      wasUpdate,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAttendance = exports.submitAttendance;

exports.getTeacherRecords = async (req, res) => {
  try {
    const records = await Attendance.find({ teacherId: req.params.teacherId })
      .sort({ date: -1 })
      .limit(100);
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { date, subject, teacherId } = req.query;
    if (!date || !subject || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'date, subject, and teacherId are required.',
      });
    }
    const session = await Attendance.findOne({ date, subject, teacherId });
    res.json({ success: true, session: session || null, exists: Boolean(session) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherAnalytics = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;
    const sessions = await Attendance.find({ teacherId }).sort({ date: -1 });
    const classAnalytics = buildClassAnalytics(sessions, subject || null);

    const studentMap = new Map();
    const relevantSessions = subject ? sessions.filter((s) => s.subject === subject) : sessions;

    let enrolledStudentIds = null;
    if (subject && isValidObjectId(teacherId)) {
      const course = await Course.findOne({ courseName: subject, teacher: teacherId }).lean();
      if (course && course.enrolledStudents) {
        enrolledStudentIds = new Set(course.enrolledStudents.map(id => String(id)));
      }
    }

    relevantSessions.forEach((session) => {
      session.records.forEach((r) => {
        const id = String(r.studentId);
        if (enrolledStudentIds && !enrolledStudentIds.has(id)) return;
        if (!studentMap.has(id)) studentMap.set(id, { studentId: id, studentName: r.studentName });
      });
    });

    const students = Array.from(studentMap.values())
      .map((s) => buildStudentSummary(s.studentId, s.studentName, relevantSessions))
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    const riskyStudents = students.filter((s) => s.riskLevel !== 'safe');

    res.json({
      success: true,
      data: {
        classAnalytics,
        students,
        insights: {
          riskyCount: riskyStudents.length,
          criticalCount: students.filter((s) => s.riskLevel === 'critical').length,
          message: classAnalytics.todayTotal > 0
            ? `${classAnalytics.todayPercentage}% class attendance today`
            : 'No attendance marked for today yet',
          trendMessage: classAnalytics.weeklyTrend.length >= 2
            ? (() => {
              const last = classAnalytics.weeklyTrend[classAnalytics.weeklyTrend.length - 1];
              const prev = classAnalytics.weeklyTrend[classAnalytics.weeklyTrend.length - 2];
              const diff = Number((last.attendance - prev.attendance).toFixed(1));
              return diff >= 0
                ? `Class attendance improved by ${diff}% this period`
                : `Class attendance dropped by ${Math.abs(diff)}% this period`;
            })()
            : 'Trend will appear after more sessions',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherSummary = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;
    const filter = { teacherId };
    if (subject) filter.subject = subject;

    const records = await Attendance.find(filter);
    const summary = {};

    let enrolledStudentIds = null;
    if (subject && isValidObjectId(teacherId)) {
      const course = await Course.findOne({ courseName: subject, teacher: teacherId }).lean();
      if (course && course.enrolledStudents) {
        enrolledStudentIds = new Set(course.enrolledStudents.map(id => String(id)));
      }
    }

    records.forEach((a) => {
      a.records.forEach((r) => {
        const key = String(r.studentId);
        if (enrolledStudentIds && !enrolledStudentIds.has(key)) return;
        if (!summary[key]) {
          summary[key] = { studentId: key, name: r.studentName, present: 0, absent: 0, late: 0, total: 0 };
        }
        summary[key][r.status] += 1;
        summary[key].total += 1;
      });
    });

    const enriched = Object.values(summary).map((s) => {
      const effectivePresent = s.present + s.late;
      const attendancePercentage = s.total > 0
        ? Number(((effectivePresent / s.total) * 100).toFixed(2))
        : 0;
      return { ...s, attendancePercentage, riskLevel: toRiskLevel(attendancePercentage) };
    });

    res.json({ success: true, summary: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Student Attendance Routing Interceptor ───────────────────────────────────

const express = require('express');
const originalRouterGet = express.Router.get || express.Router.prototype.get;
let attendanceStudentHijacked = false;

express.Router.prototype.get = function(path, ...args) {
  // We identify the attendance router when it registers '/student/:studentId'
  if (!attendanceStudentHijacked && path === '/student/:studentId') {
    attendanceStudentHijacked = true;
    console.log('⚡ Antigravity: Intercepted attendance router. Injecting Student Analytics wrapper...');
    
    const originalHandler = args[args.length - 1];
    
    const wrappedHandler = async (req, res) => {
      const originalJson = res.json;
      
      res.json = async function(data) {
        if (data && data.success && data.analytics) {
          try {
            const Student = require('../models/Student');
            const student = await Student.findById(req.params.studentId).lean();
            if (student) {
              const enrolledCourses = student.enrolledCourses || [];
              const enrolledNames = new Set(enrolledCourses.map(c => c.courseName));

              // 1. Filter out subjects that are not enrolled
              if (data.subjects) {
                data.subjects = data.subjects.filter(s => enrolledNames.has(s.subject));
              }

              // 2. Filter out stats keys
              if (data.stats) {
                Object.keys(data.stats).forEach(subj => {
                  if (!enrolledNames.has(subj)) {
                    delete data.stats[subj];
                  }
                });
              }

              // 3. Add newly enrolled courses that do not have records yet
              enrolledCourses.forEach(c => {
                if (data.subjects && !data.subjects.some(s => s.subject === c.courseName)) {
                  data.subjects.push({
                    subject: c.courseName,
                    courseCode: c.courseCode,
                    present: 0,
                    absent: 0,
                    late: 0,
                    total: 0,
                    attendancePercentage: 0,
                    predictedAttendance: 0,
                    safeLeavesRemaining: 0,
                    classesNeededFor75: 0,
                    riskLevel: 'critical', // 0% attendance
                    activities: [{ type: 'LECTURE', percentage: 0 }],
                  });
                }
                if (data.stats && !data.stats[c.courseName]) {
                  data.stats[c.courseName] = { present: 0, absent: 0, late: 0, total: 0 };
                }
              });

              // 4. Re-calculate overall analytics based on the filtered subjects
              if (data.subjects && data.subjects.length > 0) {
                let totalPresent = 0;
                let totalAbsent = 0;
                let totalLate = 0;
                let totalClasses = 0;
                data.subjects.forEach(s => {
                  totalPresent += s.present;
                  totalAbsent += s.absent;
                  totalLate += s.late;
                  totalClasses += s.total;
                });

                const effectivePresent = totalPresent + totalLate;
                const percentage = totalClasses > 0 ? Number(((effectivePresent / totalClasses) * 100).toFixed(2)) : 0;

                data.analytics.attendancePercentage = percentage;
                data.analytics.presentCount = totalPresent;
                data.analytics.absentCount = totalAbsent;
                data.analytics.lateCount = totalLate;
                data.analytics.totalClasses = totalClasses;
                data.analytics.riskLevel = percentage >= 75 ? 'safe' : (percentage >= 65 ? 'warning' : 'critical');
                
                const minPercentage = 75;
                data.analytics.safeLeavesRemaining = totalClasses === 0 ? 0 : Math.max(0, Math.floor((effectivePresent * 100) / minPercentage) - totalClasses);
                data.analytics.classesNeededFor75 = totalClasses === 0 ? 0 : (percentage >= minPercentage ? 0 : Math.max(0, Math.ceil(((minPercentage * totalClasses) - (100 * effectivePresent)) / (100 - minPercentage))));
                const rate = totalClasses === 0 ? 0 : Math.max(0.3, Math.min(1, effectivePresent / totalClasses));
                const expectedFuturePresents = Math.round(6 * rate);
                data.analytics.predictedAttendance = totalClasses === 0 ? 0 : Number((((effectivePresent + expectedFuturePresents) / (totalClasses + 6)) * 100).toFixed(2));
              } else {
                data.analytics = {
                  attendancePercentage: 0,
                  presentCount: 0,
                  absentCount: 0,
                  lateCount: 0,
                  totalClasses: 0,
                  predictedAttendance: 0,
                  safeLeavesRemaining: 0,
                  classesNeededFor75: 0,
                  riskLevel: 'critical',
                  trend: []
                };
              }
            }
          } catch (err) {
            console.error('Error in student analytics wrapper:', err);
          }
        }
        return originalJson.apply(res, [data]);
      };
      
      return originalHandler(req, res);
    };

    args[args.length - 1] = wrappedHandler;
  }
  return originalRouterGet.apply(this, [path, ...args]);
};

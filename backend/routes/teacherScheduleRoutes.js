/**
 * Teacher Schedule Routes — Phase 5
 * Mounted at: /api/teachers/schedule
 *
 * GET /api/teachers/schedule/:teacherId/today        → today's slots with live status
 * GET /api/teachers/schedule/:teacherId/week         → full week grouped by day
 * GET /api/teachers/schedule/:teacherId/attendance-slots → TtAttendanceSlots for this teacher
 */

const express = require('express');
const router = express.Router();
const TimetableSlot = require('../models/Timetable');
const TtAttendanceSlot = require('../models/TtAttendanceSlot');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayName = () => DAYS[new Date().getDay()];

const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Compute slot status based on current time vs slot times.
 * Returns: 'upcoming' | 'ongoing' | 'completed'
 */
const slotStatus = (startTime, endTime) => {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (nowMin < startMin) return 'upcoming';
  if (nowMin >= startMin && nowMin < endMin) return 'ongoing';
  return 'completed';
};

/**
 * Check if attendance was already submitted for a given teacher + subject + date.
 */
const hasAttendance = async (teacherId, subject, date) => {
  const record = await Attendance.findOne({ teacherId, subject, date }).select('_id').lean();
  return !!record;
};

// ─── GET /schedule/:teacherId/today ───────────────────────────────────────────
router.get('/:teacherId/today', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const day = todayName();
    const date = todayISO();

    const slots = await TimetableSlot.find({ teacherId, day, isActive: true })
      .sort({ startTime: 1 })
      .lean();

    // Enhance each slot with live status and attendance flag
    const enhanced = await Promise.all(
      slots.map(async (slot) => {
        const status = slotStatus(slot.startTime, slot.endTime);
        const attended = status === 'completed'
          ? await hasAttendance(teacherId, slot.subject, date)
          : false;

        return {
          ...slot,
          date,
          status,
          attendanceSubmitted: attended,
          // Missed: completed but no attendance marked
          isMissed: status === 'completed' && !attended,
        };
      })
    );

    // Current slot (ongoing), if any
    const currentSlot = enhanced.find((s) => s.status === 'ongoing') || null;

    // Upcoming slots
    const upcomingSlots = enhanced.filter((s) => s.status === 'upcoming');

    // Missed slots (class ended, no attendance)
    const missedSlots = enhanced.filter((s) => s.isMissed);

    res.json({
      success: true,
      date,
      day,
      slots: enhanced,
      currentSlot,
      upcomingSlots,
      missedSlots,
      totalToday: enhanced.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /schedule/:teacherId/week ────────────────────────────────────────────
router.get('/:teacherId/week', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { section, semester, subject, day: filterDay } = req.query;

    const filter = { teacherId, isActive: true };
    if (section) filter.section = section;
    if (semester) filter.semester = Number(semester);
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (filterDay) filter.day = filterDay;

    const slots = await TimetableSlot.find(filter).sort({ day: 1, startTime: 1 }).lean();

    // Group by day
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    workingDays.forEach((d) => { grouped[d] = []; });
    slots.forEach((slot) => {
      if (grouped[slot.day] !== undefined) {
        grouped[slot.day].push(slot);
      }
    });

    // Stats
    const uniqueSubjects = [...new Set(slots.map((s) => s.subject))];
    const uniqueSections = [...new Set(slots.map((s) => s.section).filter(Boolean))];

    res.json({
      success: true,
      slots,
      grouped,
      totalSlots: slots.length,
      uniqueSubjects,
      uniqueSections,
      workingDays,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /schedule/:teacherId/attendance-slots ────────────────────────────────
router.get('/:teacherId/attendance-slots', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date, fromDate, toDate, status } = req.query;

    const filter = { facultyId: teacherId, isActive: true };

    if (date) {
      filter.date = date;
    } else if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    } else {
      // Default: today ± 7 days
      const today = todayISO();
      const past = new Date();
      past.setDate(past.getDate() - 7);
      const future = new Date();
      future.setDate(future.getDate() + 28);
      filter.date = {
        $gte: past.toISOString().split('T')[0],
        $lte: future.toISOString().split('T')[0],
      };
    }

    if (status) filter.attendanceStatus = status;

    const attSlots = await TtAttendanceSlot.find(filter)
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Enhance: add live status for today's slots
    const today = todayISO();
    const enhanced = attSlots.map((slot) => ({
      ...slot,
      liveStatus: slot.date === today ? slotStatus(slot.startTime, slot.endTime) : null,
    }));

    // Group by date for easy frontend consumption
    const byDate = {};
    enhanced.forEach((slot) => {
      if (!byDate[slot.date]) byDate[slot.date] = [];
      byDate[slot.date].push(slot);
    });

    res.json({
      success: true,
      slots: enhanced,
      byDate,
      total: enhanced.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /schedule/attendance-slots/:slotId/status ─────────────────────────
// Update slot status after attendance is submitted
router.patch('/attendance-slots/:slotId/status', async (req, res) => {
  try {
    const { status, attendanceRecordId } = req.body;
    const validStatuses = ['pending', 'completed', 'missed', 'late_submission'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const slot = await TtAttendanceSlot.findByIdAndUpdate(
      req.params.slotId,
      { attendanceStatus: status, ...(attendanceRecordId ? { attendanceRecordId } : {}) },
      { new: true }
    );

    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });

    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

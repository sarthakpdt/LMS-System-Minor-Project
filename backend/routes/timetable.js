const express = require('express');
const router = express.Router();
const TimetableSlot = require('../models/Timetable');
const User = require('../models/User');

// ── GET /api/timetable — get all slots (with optional filters) ──
router.get('/', async (req, res) => {
  try {
    const { semester, department, teacherId } = req.query;
    const filter = { isActive: true };
    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;
    if (teacherId) filter.teacherId = teacherId;

    const slots = await TimetableSlot.find(filter).sort({ day: 1, startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/timetable/teacher/:teacherId — teacher's own schedule ──
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const slots = await TimetableSlot.find({
      teacherId: req.params.teacherId,
      isActive: true
    }).sort({ day: 1, startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/timetable — create a new slot ──────────────────
router.post('/', async (req, res) => {
  try {
    const { subject, day, startTime, endTime, semester, department, teacherId, teacherName, room } = req.body;

    if (!subject || !teacherId) {
      return res.status(400).json({ success: false, message: 'Subject and teacherId are required' });
    }

    // Check for duplicate (same subject+day+semester+department+teacherId)
    const existing = await TimetableSlot.findOne({
      subject, day, semester, department, teacherId, isActive: true
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A slot for "${subject}" on ${day} already exists for this teacher. Try a different day.`
      });
    }

    // Also check time conflict for the same teacher on same day
    const conflict = await TimetableSlot.findOne({
      teacherId, day, isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Time conflict: ${conflict.subject} is already scheduled ${conflict.startTime}–${conflict.endTime} on ${day} for this teacher.`
      });
    }

    const slot = await TimetableSlot.create({
      subject, day, startTime, endTime,
      semester: Number(semester),
      department,
      teacherId,
      teacherName: teacherName || '',
      room: room || '',
      isActive: true
    });

    res.status(201).json({ success: true, slot });
  } catch (err) {
    // Handle mongoose duplicate key
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This timetable slot already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/timetable/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await TimetableSlot.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Timetable slot removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
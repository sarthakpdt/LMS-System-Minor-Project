const express = require('express');
const router = express.Router();
const TimetableSlot = require('../models/Timetable');
const User = require('../models/User');

// ── GET /api/timetable — get all slots (with optional filters) ──
router.get('/', async (req, res) => {
  try {
    const { semester, department, teacherId, section } = req.query;
    const filter = { isActive: true };
    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;
    if (teacherId) filter.teacherId = teacherId;
    if (section) filter.section = section;

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
    const { subject, day, startTime, endTime, semester, department, teacherId, teacherName, room, section } = req.body;
    // Validate required fields
    if (!subject || !teacherId || !teacherName) {
      return res.status(400).json({ success: false, message: 'Subject, teacherId, and teacherName are required' });
    }

    const currentSection = section || 'A';

    // Check for duplicate (same subject+day+semester+department+teacherId+section)
    const existing = await TimetableSlot.findOne({
      subject,
      day,
      semester: Number(semester),
      department,
      section: currentSection,
      teacherId,
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A slot for "${subject}" on ${day} in section ${currentSection} already exists.`,
      });
    }

    // Check teacher time conflict
    const teacherConflict = await TimetableSlot.findOne({
      teacherId,
      day,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (teacherConflict) {
      return res.status(409).json({
        success: false,
        message: `Time conflict: ${teacherConflict.teacherName} is already assigned to "${teacherConflict.subject}" on ${day} (${teacherConflict.startTime}–${teacherConflict.endTime}).`,
      });
    }

    // Check section time conflict
    const sectionConflict = await TimetableSlot.findOne({
      department,
      semester: Number(semester),
      section: currentSection,
      day,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (sectionConflict) {
      return res.status(409).json({
        success: false,
        message: `Time conflict: Section ${currentSection} already has "${sectionConflict.subject}" scheduled on ${day} (${sectionConflict.startTime}–${sectionConflict.endTime}).`,
      });
    }

    // Check room time conflict
    if (room && room.trim()) {
      const roomConflict = await TimetableSlot.findOne({
        room,
        day,
        isActive: true,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });
      if (roomConflict) {
        return res.status(409).json({
          success: false,
          message: `Room conflict: Room ${room} is already booked for "${roomConflict.subject}" on ${day} (${roomConflict.startTime}–${roomConflict.endTime}).`,
        });
      }
    }

    const slot = await TimetableSlot.create({
      subject, day, startTime, endTime,
      semester: Number(semester),
      department,
      section: currentSection,
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

// Automatic timetable generation engine (admin)
const engineRouter = require('./timetableEngineRoutes');
router.use('/engine', engineRouter);

module.exports = router;
const express = require('express');
const router = express.Router();
const TimetableSlot = require('../models/Timetable');
const User = require('../models/User');

// GET all timetable slots (admin view)
router.get('/', async (req, res) => {
  try {
    const { semester, department } = req.query;
    const filter = { isActive: true };
    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;

    const slots = await TimetableSlot.find(filter).sort({ day: 1, startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET timetable slots for a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const slots = await TimetableSlot.find({ teacherId: req.params.teacherId, isActive: true })
      .sort({ day: 1, startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET timetable for a semester + department (student view)
router.get('/semester/:sem/department/:dept', async (req, res) => {
  try {
    const slots = await TimetableSlot.find({
      semester: Number(req.params.sem),
      department: req.params.dept,
      isActive: true
    }).sort({ day: 1, startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create a timetable slot (admin only)
router.post('/', async (req, res) => {
  try {
    const { subject, day, startTime, endTime, semester, department, teacherId, room } = req.body;

    if (!subject || !day || !startTime || !endTime || !semester || !department || !teacherId) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Look up teacher name
    const teacher = await User.findById(teacherId).select('name');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const slot = await TimetableSlot.create({
      subject, day, startTime, endTime,
      semester: Number(semester), department,
      teacherId, teacherName: teacher.name,
      room: room || ''
    });

    res.status(201).json({ success: true, slot });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This subject is already scheduled at this time for the selected semester/department/teacher.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update a slot (admin only)
router.put('/:id', async (req, res) => {
  try {
    const slot = await TimetableSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a slot (admin only)
router.delete('/:id', async (req, res) => {
  try {
    await TimetableSlot.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Slot removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
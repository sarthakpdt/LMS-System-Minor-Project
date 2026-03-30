const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// GET students filtered by semester and department (for teacher marking attendance based on timetable slot)
router.get('/students', async (req, res) => {
  try {
    const { semester, department } = req.query;
    const filter = { role: 'student', approvalStatus: 'approved' };
    if (semester) filter.semester = Number(semester);
    if (department) filter.department = department;

    const students = await User.find(filter).select('_id name email semester department');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST mark/update attendance for a class
router.post('/mark', async (req, res) => {
  try {
    const { date, subject, timetableSlotId, teacherId, teacherName, records } = req.body;

    if (!date || !subject || !teacherId || !records) {
      return res.status(400).json({ success: false, message: 'date, subject, teacherId, and records are required.' });
    }

    // Upsert: update if already marked for same date+subject+teacher, else create
    let attendance = await Attendance.findOne({ date, subject, teacherId });
    if (attendance) {
      attendance.records = records;
      if (timetableSlotId) attendance.timetableSlotId = timetableSlotId;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        date, subject, timetableSlotId, teacherId, teacherName, records
      });
    }

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET attendance records marked by a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const records = await Attendance.find({ teacherId: req.params.teacherId })
      .sort({ date: -1 })
      .limit(100);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET a student's own attendance record
router.get('/student/:studentId', async (req, res) => {
  try {
    const allRecords = await Attendance.find({ 'records.studentId': req.params.studentId })
      .sort({ date: -1 });

    const result = allRecords.map(a => {
      const studentRecord = a.records.find(r => r.studentId.toString() === req.params.studentId);
      return {
        date: a.date,
        subject: a.subject,
        status: studentRecord?.status || 'absent',
        teacherName: a.teacherName
      };
    });

    // Calculate stats per subject
    const bySubject = {};
    result.forEach(r => {
      if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, absent: 0, late: 0, total: 0 };
      bySubject[r.subject][r.status]++;
      bySubject[r.subject].total++;
    });

    res.json({ success: true, records: result, stats: bySubject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET summary stats for all students (teacher/admin analytics)
router.get('/summary/:teacherId', async (req, res) => {
  try {
    const records = await Attendance.find({ teacherId: req.params.teacherId });
    const summary = {};
    records.forEach(a => {
      a.records.forEach(r => {
        const key = r.studentName || String(r.studentId);
        if (!summary[key]) summary[key] = { name: r.studentName, present: 0, absent: 0, late: 0, total: 0 };
        summary[key][r.status]++;
        summary[key].total++;
      });
    });
    res.json({ success: true, summary: Object.values(summary) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
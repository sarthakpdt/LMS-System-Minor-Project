const express = require('express');
const router = express.Router();
const { generateTimetable, cloneTimetable, exportTimetable, getConflicts } = require('../controllers/timetableController');
const { protect } = require('../middleware/auth'); // existing JWT auth middleware

// All routes are protected – admin only (assume protect checks role)
router.post('/timetable/generate', protect, generateTimetable);
router.post('/timetable/clone', protect, cloneTimetable);
router.get('/timetable/:timetableId/conflicts', protect, getConflicts);
router.get('/timetable/:timetableId/export/:format', protect, exportTimetable);

module.exports = router;

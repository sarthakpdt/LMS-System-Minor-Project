const express = require('express');
const router = express.Router();
const controller = require('../controllers/timetableController');

// Configuration routes
router.get('/config', controller.getActiveConfig);
router.post('/config', controller.saveConfig);
router.put('/config/:id', controller.updateConfig);

// Subjects routes
router.get('/subjects', controller.getSubjects);
router.post('/subjects', controller.saveSubject);
router.post('/subjects/bulk', controller.saveSubjectsBulk);
router.delete('/subjects/:id', controller.deleteSubject);
router.post('/subjects/:id/duplicate', controller.duplicateSubject);

// Rooms routes
router.get('/rooms', controller.getRooms);
router.post('/rooms', controller.saveRoom);
router.delete('/rooms/:id', controller.deleteRoom);

// Faculty constraints routes
router.get('/faculty-constraints', controller.getFacultyConstraints);
router.post('/faculty-constraints', controller.saveFacultyConstraint);
router.get('/teachers', controller.getTeachers);

// Generation / Publish engine routes
router.post('/generate', controller.generateTimetable);
router.post('/publish', controller.publishTimetable);
router.get('/timetables', controller.listTimetables);
router.get('/timetables/:id', controller.getTimetableById);
router.post('/timetables/save', controller.saveTimetable);
router.put('/timetables/:id', controller.updateTimetable);
router.delete('/timetables/:id', controller.deleteTimetable);
router.get('/draft', controller.getLatestDraft);
router.get('/published', controller.getPublished);
router.get('/published/student/:studentId', controller.getPublishedForStudent);

router.get('/students', controller.getStudentsForAssignment);
router.post('/students/assign', controller.assignStudents);

module.exports = router;

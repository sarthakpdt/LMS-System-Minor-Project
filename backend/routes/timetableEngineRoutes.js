const express = require('express');
const router = express.Router();
const controller = require('../controllers/timetableController');
const genController = require('../controllers/timetableGenerationController');

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

// ── Phase 3: Generation Engine ──
router.post('/generate', genController.generateTimetable);
router.post('/regenerate', genController.regenerateTimetable);
router.post('/publish', controller.publishTimetable);
router.post('/clone', genController.cloneSemesterStructure);
router.get('/recommend-slots', genController.recommendSlots);
router.get('/analytics/rooms', genController.getRoomUtilization);
router.get('/analytics/faculty-workload', genController.getFacultyWorkload);
router.get('/analytics/heatmap', genController.getHeatmapData);

router.get('/timetables', controller.listTimetables);
router.post('/timetables/save', controller.saveTimetable);
router.get('/draft', controller.getLatestDraft);
router.get('/published', controller.getPublished);
router.get('/published/student/:studentId', controller.getPublishedForStudent);

router.get('/students', controller.getStudentsForAssignment);
router.post('/students/assign', controller.assignStudents);

// Timetable sub-routes (specific paths before /:id)
router.post('/timetables/:id/approve', genController.approveTimetable);
router.get('/timetables/:id/versions', genController.listTimetableVersions);
router.post('/timetables/:id/restore', genController.restoreTimetableVersion);
router.get('/timetables/:id/report', genController.getGenerationReport);
router.post('/timetables/:id/apply-resolution', genController.applyClashResolution);
router.post('/timetables/:id/swap', genController.swapTimetableEntries);
router.patch('/timetables/:id/entry/:entryIndex', genController.editTimetableEntry);
router.get('/timetables/:id/clash-resolution', genController.getClashResolutions);

router.get('/timetables/:id', controller.getTimetableById);
router.put('/timetables/:id', controller.updateTimetable);
router.delete('/timetables/:id', controller.deleteTimetable);

module.exports = router;

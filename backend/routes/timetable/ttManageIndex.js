const express = require('express');
const router = express.Router();
const configController = require('../../controllers/timetable/ttConfigController');

// Mount individual resource routes
router.use('/academic-years',   require('./academicYearRoutes'));
router.use('/branches',         require('./branchRoutes'));
router.use('/semesters',        require('./semesterRoutes'));
router.use('/sections',         require('./sectionRoutes'));
router.use('/departments',      require('./departmentRoutes'));
router.use('/labs',             require('./labRoutes'));
router.use('/course-assignments', require('./courseAssignmentRoutes'));
router.use('/lecture-slots',    require('./lectureSlotRoutes'));
router.use('/working-days',     require('./workingDayRoutes'));
router.use('/lunch-breaks',     require('./lunchBreakRoutes'));

// Configuration aggregation and legacy synchronization routes
router.get('/configs/:academicYearId', configController.getUnifiedConfig);
router.post('/configs/:academicYearId/sync', configController.syncLegacyConfig);

module.exports = router;

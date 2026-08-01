const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/semesterController');

router.get('/', controller.getAllSemesters);
router.get('/branch/:branchId', controller.getSemestersByBranch);
router.get('/:id', controller.getSemesterById);
router.post('/', controller.createSemester);
router.put('/:id', controller.updateSemester);
router.delete('/:id', controller.deleteSemester);

module.exports = router;

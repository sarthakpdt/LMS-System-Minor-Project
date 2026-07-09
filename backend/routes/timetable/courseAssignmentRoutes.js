const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/courseAssignmentController');

router.get('/', controller.getAllAssignments);
router.get('/faculty/:facultyId', controller.getAssignmentsByFaculty);
router.get('/section/:sectionId', controller.getAssignmentsBySection);
router.get('/:id', controller.getAssignmentById);
router.post('/', controller.createAssignment);
router.put('/:id', controller.updateAssignment);
router.delete('/:id', controller.deleteAssignment);

module.exports = router;

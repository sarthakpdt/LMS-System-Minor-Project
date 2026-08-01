const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/academicYearController');

router.get('/', controller.getAllAcademicYears);
router.get('/:id', controller.getAcademicYearById);
router.post('/', controller.createAcademicYear);
router.put('/:id', controller.updateAcademicYear);
router.delete('/:id', controller.deleteAcademicYear);
router.patch('/:id/set-current', controller.setCurrentAcademicYear);

module.exports = router;

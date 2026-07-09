const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/sectionController');

router.get('/', controller.getAllSections);
router.get('/semester/:semesterId', controller.getSectionsBySemester);
router.get('/:id', controller.getSectionById);
router.post('/', controller.createSection);
router.put('/:id', controller.updateSection);
router.delete('/:id', controller.deleteSection);

module.exports = router;

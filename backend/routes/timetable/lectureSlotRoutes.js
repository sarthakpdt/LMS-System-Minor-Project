const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/lectureSlotController');

router.get('/', controller.getAllLectureSlots);
router.get('/:id', controller.getLectureSlotById);
router.post('/', controller.createLectureSlot);
router.put('/:id', controller.updateLectureSlot);
router.delete('/:id', controller.deleteLectureSlot);

module.exports = router;

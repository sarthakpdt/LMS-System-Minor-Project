const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/lunchBreakController');

router.get('/', controller.getAllLunchBreaks);
router.get('/:id', controller.getLunchBreakById);
router.post('/', controller.createLunchBreak);
router.put('/:id', controller.updateLunchBreak);
router.delete('/:id', controller.deleteLunchBreak);

module.exports = router;

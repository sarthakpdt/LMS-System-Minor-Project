const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/workingDayController');

router.get('/', controller.getAllWorkingDays);
router.get('/:id', controller.getWorkingDayById);
router.post('/', controller.createWorkingDay);
router.put('/:id', controller.updateWorkingDay);
router.delete('/:id', controller.deleteWorkingDay);
router.post('/bulk', controller.bulkSetWorkingDays);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/timetable/labController');

router.get('/', controller.getAllLabs);
router.get('/:id', controller.getLabById);
router.post('/', controller.createLab);
router.put('/:id', controller.updateLab);
router.delete('/:id', controller.deleteLab);

module.exports = router;

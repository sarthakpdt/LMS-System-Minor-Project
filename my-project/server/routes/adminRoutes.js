const express = require('express');
const router = express.Router();
const { getPendingStudents, updateStudentStatus } = require('../controllers/adminController');

router.get('/pending-students', getPendingStudents);
router.post('/update-status', updateStudentStatus);

module.exports = router;
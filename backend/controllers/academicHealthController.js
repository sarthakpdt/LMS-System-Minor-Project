const { getAcademicHealth } = require('../services/academicHealthService');

exports.getStudentAcademicHealth = async (req, res) => {
  try {
    const { studentId } = req.params;
    const data = await getAcademicHealth(studentId);
    res.json({ success: true, data });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Failed to fetch academic health data',
    });
  }
};

const User = require('../models/User');

// Get all pending student approvals
exports.getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await User.find({ 
      role: 'student', 
      approvalStatus: 'pending' 
    });
    res.status(200).json({ success: true, data: pendingStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve or Reject a student
exports.updateStudentStatus = async (req, res) => {
  try {
    const { userId, status } = req.body; // status: 'approved' or 'rejected'
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { approvalStatus: status }, 
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: `Student ${status} successfully`, 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
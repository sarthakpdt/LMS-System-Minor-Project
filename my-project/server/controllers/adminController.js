const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');

// @desc    Get all pending students
exports.getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await Student.find({ approvalStatus: 'pending' });
    
    res.status(200).json({
      success: true,
      count: pendingStudents.length,
      data: pendingStudents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all approved students
exports.getApprovedStudents = async (req, res) => {
  try {
    const approvedStudents = await Student.find({ approvalStatus: 'approved' });
    
    res.status(200).json({
      success: true,
      count: approvedStudents.length,
      data: approvedStudents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve a student
exports.approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { adminId } = req.body;

    if (!studentId || !adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and Admin ID are required' 
      });
    }

    // Find and update student
    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Add to admin's approved students
    await Admin.findByIdAndUpdate(
      adminId,
      { $push: { approvedStudents: studentId } }
    );

    res.status(200).json({
      success: true,
      message: `Student ${student.name} has been approved!`,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a student
exports.rejectStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { adminId, reason } = req.body;

    if (!studentId || !adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and Admin ID are required' 
      });
    }

    // Find and update student
    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        approvalStatus: 'rejected',
        approvedBy: adminId,
        rejectionReason: reason || 'No reason provided',
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: `Student ${student.name} has been rejected!`,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending teachers
exports.getPendingTeachers = async (req, res) => {
  try {
    const pendingTeachers = await Teacher.find({ approvalStatus: 'pending' });
    
    res.status(200).json({
      success: true,
      count: pendingTeachers.length,
      data: pendingTeachers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve a teacher
exports.approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { adminId } = req.body;

    if (!teacherId || !adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher ID and Admin ID are required' 
      });
    }

    // Find and update teacher
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvalDate: new Date()
      },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    // Add to admin's approved teachers
    await Admin.findByIdAndUpdate(
      adminId,
      { $push: { approvedTeachers: teacherId } }
    );

    res.status(200).json({
      success: true,
      message: `Teacher ${teacher.name} has been approved!`,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const approvedStudents = await Student.countDocuments({ approvalStatus: 'approved' });
    const pendingStudents = await Student.countDocuments({ approvalStatus: 'pending' });
    const rejectedStudents = await Student.countDocuments({ approvalStatus: 'rejected' });

    const totalTeachers = await Teacher.countDocuments();
    const approvedTeachers = await Teacher.countDocuments({ approvalStatus: 'approved' });
    const pendingTeachers = await Teacher.countDocuments({ approvalStatus: 'pending' });

    const totalAdmins = await Admin.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          approved: approvedStudents,
          pending: pendingStudents,
          rejected: rejectedStudents
        },
        teachers: {
          total: totalTeachers,
          approved: approvedTeachers,
          pending: pendingTeachers
        },
        admins: {
          total: totalAdmins
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
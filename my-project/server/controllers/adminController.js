const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const Course = require('../models/Course');

// @desc    Get all pending students
exports.getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await Student.find({ approvalStatus: 'pending' });
    res.status(200).json({ success: true, count: pendingStudents.length, data: pendingStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all approved students
exports.getApprovedStudents = async (req, res) => {
  try {
    const approvedStudents = await Student.find({ approvalStatus: 'approved' });
    res.status(200).json({ success: true, count: approvedStudents.length, data: approvedStudents });
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
      return res.status(400).json({ success: false, message: 'Student ID and Admin ID are required' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { approvalStatus: 'approved', approvedBy: adminId, approvalDate: new Date() },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Admin.findByIdAndUpdate(adminId, { $push: { approvedStudents: studentId } });

    res.status(200).json({ success: true, message: `Student ${student.name} has been approved!`, data: student });
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
      return res.status(400).json({ success: false, message: 'Student ID and Admin ID are required' });
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      { approvalStatus: 'rejected', approvedBy: adminId, rejectionReason: reason || 'No reason provided', approvalDate: new Date() },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, message: `Student ${student.name} has been rejected!`, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending teachers
exports.getPendingTeachers = async (req, res) => {
  try {
    const pendingTeachers = await Teacher.find({ approvalStatus: 'pending' });
    res.status(200).json({ success: true, count: pendingTeachers.length, data: pendingTeachers });
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
      return res.status(400).json({ success: false, message: 'Teacher ID and Admin ID are required' });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { approvalStatus: 'approved', approvedBy: adminId, approvalDate: new Date() },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await Admin.findByIdAndUpdate(adminId, { $push: { approvedTeachers: teacherId } });

    res.status(200).json({ success: true, message: `Teacher ${teacher.name} has been approved!`, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher by ID  (fixes the 404 in Students.tsx)
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId).lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    console.error('getTeacherById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all courses (with enrolled student count)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .lean();
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, department, semester, teacherId, description } = req.body;

    if (!courseCode || !courseName || !department || !semester) {
      return res.status(400).json({ success: false, message: 'courseCode, courseName, department, semester are required' });
    }

    const existing = await Course.findOne({ courseCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Course with this code already exists' });
    }

    const course = await Course.create({
      courseCode,
      courseName,
      department,
      semester: String(semester),
      teacher: teacherId || null,
      description: description || '',
    });

    // If a teacher is assigned, add course to teacher's assignedCourses
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: {
          assignedCourses: {
            courseId: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            semester: course.semester,
          }
        }
      });
    }

    res.status(201).json({ success: true, message: 'Course created!', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll all approved students of a dept+semester into a course
exports.enrollStudentsByCriteria = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { department, semester } = req.body;

    if (!department || !semester) {
      return res.status(400).json({ success: false, message: 'department and semester are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find all approved students matching dept + semester
    const students = await Student.find({
      approvalStatus: 'approved',
      department,
      semester: String(semester),
    });

    if (students.length === 0) {
      return res.status(200).json({ success: true, message: 'No matching students found', enrolled: 0 });
    }

    const studentIds = students.map(s => s._id);

    // Add course to each student's enrolledCourses (avoid duplicates)
    await Student.updateMany(
      {
        _id: { $in: studentIds },
        'enrolledCourses.courseId': { $ne: courseId },
      },
      {
        $push: {
          enrolledCourses: {
            courseId: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            semester: course.semester,
            department: course.department,
          }
        }
      }
    );

    // Add students to the course's enrolledStudents list (avoid duplicates)
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: { $each: studentIds } }
    });

    // If course has a teacher, add these students to teacher's assignedStudents
    if (course.teacher) {
      await Teacher.findByIdAndUpdate(course.teacher, {
        $addToSet: { assignedStudents: { $each: studentIds } }
      });
    }

    res.status(200).json({
      success: true,
      message: `${students.length} students enrolled in ${course.courseName}`,
      enrolled: students.length,
    });
  } catch (error) {
    console.error('enrollStudentsByCriteria error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get students enrolled in a specific course
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('enrolledStudents', 'name email department semester studentId level').lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course.enrolledStudents || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all approved teachers (for course assignment dropdown)
exports.getApprovedTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({ approvalStatus: 'approved' }, 'name email department assignedCourses employeeId').lean();
    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID (for student dashboard)
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign a teacher to a course
exports.assignTeacherToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'teacherId is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Remove course from old teacher's assignedCourses if different
    if (course.teacher && String(course.teacher) !== String(teacherId)) {
      await Teacher.findByIdAndUpdate(course.teacher, {
        $pull: { assignedCourses: { courseId: course._id } }
      });
    }

    // Update course with new teacher
    course.teacher = teacherId;
    await course.save();

    // Add course to teacher's assignedCourses if not already there
    const alreadyAssigned = teacher.assignedCourses.some(
      c => String(c.courseId) === String(courseId)
    );
    if (!alreadyAssigned) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: {
          assignedCourses: {
            courseId: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            semester: course.semester,
          }
        }
      });
    }

    // Also add enrolled students to teacher's assignedStudents
    if (course.enrolledStudents?.length) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $addToSet: { assignedStudents: { $each: course.enrolledStudents } }
      });
    }

    const updated = await Course.findById(courseId).populate('teacher', 'name email department').lean();
    res.status(200).json({ success: true, message: `${teacher.name} assigned to ${course.courseName}`, data: updated });
  } catch (error) {
    console.error('assignTeacherToCourse error:', error);
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
    const totalCourses = await Course.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        students: { total: totalStudents, approved: approvedStudents, pending: pendingStudents, rejected: rejectedStudents },
        teachers: { total: totalTeachers, approved: approvedTeachers, pending: pendingTeachers },
        admins: { total: totalAdmins },
        courses: { total: totalCourses },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
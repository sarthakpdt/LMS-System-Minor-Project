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

// @desc    Get all approved students with optional filtering and search
exports.getApprovedStudents = async (req, res) => {
  try {
    const { department, semester, section, search } = req.query;
    const query = { approvalStatus: 'approved' };
    
    if (department && department !== 'all') {
      query.department = department;
    }
    if (semester && semester !== 'all') {
      query.semester = String(semester);
    }
    if (section && section !== 'all') {
      if (section === 'unassigned') {
        query.section = { $in: [null, ''] };
      } else {
        query.section = section;
      }
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const approvedStudents = await Student.find(query);
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

    // Only update approval fields — never touch email/password/role
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: { approvalStatus: 'approved', approvedBy: adminId, approvalDate: new Date() } },
      { new: true, runValidators: false }
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

// @desc    Reject a teacher
exports.rejectTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { adminId, reason } = req.body;

    if (!teacherId || !adminId) {
      return res.status(400).json({ success: false, message: 'Teacher ID and Admin ID are required' });
    }

    // Only update approval fields — never touch email/password/role
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: { approvalStatus: 'rejected', approvedBy: adminId, rejectionReason: reason || 'No reason provided', approvalDate: new Date() } },
      { new: true, runValidators: false }
    );

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    res.status(200).json({ success: true, message: `Teacher ${teacher.name} has been rejected.`, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher by ID
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

// @desc    Get all courses (with populated teacher)
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
    const { courseCode, courseName, department, semester, teacherId, description, section, credits, type } = req.body;

    if (!courseCode || !courseName || !department || !semester) {
      return res.status(400).json({ success: false, message: 'courseCode, courseName, department, semester are required' });
    }

    // Duplicate check: same branch + semester + subject code
    const existing = await Course.findOne({
      courseCode: courseCode.toUpperCase(),
      department,
      semester: String(semester),
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `A course with code "${courseCode}" already exists in ${department} Semester ${semester}` });
    }

    // Validate teacher exists before assigning
    if (teacherId) {
      const teacherExists = await Teacher.findById(teacherId).select('_id').lean();
      if (!teacherExists) {
        return res.status(400).json({ success: false, message: 'Teacher not found. Cannot assign to course.' });
      }
    }

    const course = await Course.create({
      courseCode,
      courseName,
      department,
      semester: String(semester),
      credits: Number(credits) || 4,
      type: type || 'theory',
      teacher: teacherId || null,
      description: description || '',
      section: section || null,
    });

    if (teacherId) {
      // Only update assignedCourses — NEVER touch email/password/role
      await Teacher.findByIdAndUpdate(
        teacherId,
        {
          $push: {
            assignedCourses: {
              courseId: course._id,
              courseCode: course.courseCode,
              courseName: course.courseName,
              semester: course.semester,
            }
          }
        },
        { runValidators: false }
      );
    }

    res.status(201).json({ success: true, message: 'Course created successfully!', data: course });
  } catch (error) {
    console.error('createCourse error:', error);
    // Friendlier message for MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A course with this code already exists in this branch and semester' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing course
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { courseCode, courseName, department, semester, teacherId, description, section, credits, type } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check for duplicates if code/dept/semester changed
    const newCode = courseCode ? courseCode.toUpperCase() : course.courseCode;
    const newDept = department || course.department;
    const newSem = semester ? String(semester) : course.semester;
    if (newCode !== course.courseCode || newDept !== course.department || newSem !== course.semester) {
      const dup = await Course.findOne({ courseCode: newCode, department: newDept, semester: newSem, _id: { $ne: courseId } });
      if (dup) {
        return res.status(400).json({ success: false, message: `A course with code "${newCode}" already exists in ${newDept} Semester ${newSem}` });
      }
    }

    // Handle teacher change
    const oldTeacherId = course.teacher ? String(course.teacher) : null;
    const newTeacherId = teacherId !== undefined ? (teacherId || null) : course.teacher;

    // Update course fields
    if (courseCode) course.courseCode = courseCode;
    if (courseName) course.courseName = courseName;
    if (department) course.department = department;
    if (semester) course.semester = String(semester);
    if (credits !== undefined) course.credits = Number(credits);
    if (type) course.type = type;
    if (description !== undefined) course.description = description;
    if (section !== undefined) course.section = section || null;
    if (teacherId !== undefined) course.teacher = teacherId || null;

    await course.save();

    // Sync teacher assignedCourses if teacher changed
    if (teacherId !== undefined && String(newTeacherId) !== oldTeacherId) {
      // Remove from old teacher
      if (oldTeacherId) {
        await Teacher.findByIdAndUpdate(oldTeacherId, {
          $pull: { assignedCourses: { courseId: course._id } }
        }, { runValidators: false });
      }
      // Add to new teacher
      if (newTeacherId) {
        const alreadyAssigned = await Teacher.findOne({ _id: newTeacherId, 'assignedCourses.courseId': course._id });
        if (!alreadyAssigned) {
          await Teacher.findByIdAndUpdate(newTeacherId, {
            $push: { assignedCourses: { courseId: course._id, courseCode: course.courseCode, courseName: course.courseName, semester: course.semester } }
          }, { runValidators: false });
        }
      }
    }

    const updated = await Course.findById(courseId).populate('teacher', 'name email').lean();
    res.status(200).json({ success: true, message: 'Course updated successfully!', data: updated });
  } catch (error) {
    console.error('updateCourse error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A course with this code already exists in this branch and semester' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Remove course from teacher's assignedCourses
    if (course.teacher) {
      await Teacher.findByIdAndUpdate(course.teacher, {
        $pull: { assignedCourses: { courseId: course._id } }
      }, { runValidators: false });
    }

    // Remove course from students' enrolledCourses
    const Student = require('../models/Student');
    await Student.updateMany(
      { 'enrolledCourses.courseId': course._id },
      { $pull: { enrolledCourses: { courseId: course._id } } }
    );

    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ success: true, message: `Course "${course.courseName}" deleted successfully` });
  } catch (error) {
    console.error('deleteCourse error:', error);
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

    const studentQuery = {
      approvalStatus: 'approved',
      department,
      semester: String(semester),
    };
    if (course.section) {
      studentQuery.section = course.section;
    }

    const students = await Student.find(studentQuery);

    if (students.length === 0) {
      return res.status(200).json({ success: true, message: 'No matching students found', enrolled: 0 });
    }

    const studentIds = students.map(s => s._id);

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

    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: { $each: studentIds } }
    });

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
    const course = await Course.findById(courseId)
      .populate('enrolledStudents', 'name email department semester studentId level')
      .lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course.enrolledStudents || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all teachers for course assignment dropdown
// ✅ FIX: Returns ALL teachers (approved + pending) so admin can assign any registered teacher
exports.getApprovedTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find(
      { isActive: true },
      'name email department assignedCourses employeeId approvalStatus'
    ).lean();
    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID
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

    // Fetch teacher — only select safe, non-auth fields for logic; login fields stay untouched
    const teacher = await Teacher.findById(teacherId).select('_id name email department assignedCourses').lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Remove course from old teacher's assignedCourses if teacher is changing
    if (course.teacher && String(course.teacher) !== String(teacherId)) {
      await Teacher.findByIdAndUpdate(
        course.teacher,
        { $pull: { assignedCourses: { courseId: course._id } } },
        { runValidators: false }
      );
    }

    // Update ONLY the course.teacher field — nothing else on the course
    await Course.findByIdAndUpdate(
      courseId,
      { $set: { teacher: teacherId } },
      { runValidators: false }
    );

    // Add course to teacher's assignedCourses if not already there
    const alreadyAssigned = (teacher.assignedCourses || []).some(
      c => String(c.courseId) === String(courseId)
    );
    if (!alreadyAssigned) {
      // Only update assignedCourses array — NEVER touch email/password/role
      await Teacher.findByIdAndUpdate(
        teacherId,
        {
          $push: {
            assignedCourses: {
              courseId: course._id,
              courseCode: course.courseCode,
              courseName: course.courseName,
              semester: course.semester,
            }
          }
        },
        { runValidators: false }
      );
    }

    // Add enrolled students to teacher's assignedStudents (safe addToSet only)
    if (course.enrolledStudents?.length) {
      await Teacher.findByIdAndUpdate(
        teacherId,
        { $addToSet: { assignedStudents: { $each: course.enrolledStudents } } },
        { runValidators: false }
      );
    }

    const updated = await Course.findById(courseId)
      .populate('teacher', 'name email department')
      .lean();

    res.status(200).json({
      success: true,
      message: `${teacher.name} assigned to ${course.courseName}`,
      data: updated
    });
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

// ── Helpers ──────────────────────────────────────────────────────────────────

// Sync student course enrollments and teacher's assignedStudents list when section changes
const syncStudentCoursesAndTeacherAssignments = async (studentId) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) return;

    const { semester, department, section } = student;

    // Find all active courses matching student's semester and branch/dept
    const allSemesterCourses = await Course.find({
      semester: String(semester),
      department: department,
      isActive: true
    });

    const targetCourses = [];
    const coursesToRemove = [];

    allSemesterCourses.forEach(course => {
      if (!course.section || course.section === '' || course.section === 'null') {
        targetCourses.push(course);
      } else if (String(course.section).toUpperCase() === String(section || '').toUpperCase()) {
        targetCourses.push(course);
      } else {
        coursesToRemove.push(course);
      }
    });

    // Remove student from courses of other sections
    const removeCourseIds = coursesToRemove.map(c => c._id);
    if (removeCourseIds.length > 0) {
      await Course.updateMany(
        { _id: { $in: removeCourseIds } },
        { $pull: { enrolledStudents: student._id } }
      );
    }

    // Add student to matching courses
    const targetCourseIds = targetCourses.map(c => c._id);
    if (targetCourseIds.length > 0) {
      await Course.updateMany(
        { _id: { $in: targetCourseIds } },
        { $addToSet: { enrolledStudents: student._id } }
      );
    }

    // Rebuild student's enrolledCourses list in Student document
    student.enrolledCourses = targetCourses.map(course => ({
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      semester: course.semester,
      department: course.department
    }));

    await student.save();

    // Rebuild Teacher.assignedStudents lists
    const allTeachers = await Teacher.find({});
    for (const teacher of allTeachers) {
      const teachesAny = teacher.assignedCourses.some(ac => 
        targetCourseIds.some(tcId => String(tcId) === String(ac.courseId))
      );

      if (teachesAny) {
        await Teacher.findByIdAndUpdate(teacher._id, {
          $addToSet: { assignedStudents: student._id }
        });
      } else {
        await Teacher.findByIdAndUpdate(teacher._id, {
          $pull: { assignedStudents: student._id }
        });
      }
    }
  } catch (err) {
    console.error('Error syncing student courses:', err);
  }
};

// ── Section Management Endpoints ─────────────────────────────────────────────

// Manual single student assignment/update
exports.assignSection = async (req, res) => {
  try {
    const { studentId, section, department, semester } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (section !== undefined) student.section = section || null;
    if (department !== undefined) student.department = department;
    if (semester !== undefined) student.semester = String(semester);

    await student.save();
    await syncStudentCoursesAndTeacherAssignments(student._id);

    res.status(200).json({ success: true, message: 'Student details and course mapping updated successfully', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk set section for multiple students
exports.bulkAssignSection = async (req, res) => {
  try {
    const { studentIds, section } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { section: section || null } }
    );

    for (const id of studentIds) {
      await syncStudentCoursesAndTeacherAssignments(id);
    }

    res.status(200).json({ success: true, message: `Successfully assigned section to ${studentIds.length} students` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk distribute multiple students across sections based on group size
exports.bulkDistribute = async (req, res) => {
  try {
    const { studentIds, groupSize, sections, sortBy } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }
    if (!groupSize || groupSize <= 0) {
      return res.status(400).json({ success: false, message: 'Valid groupSize is required' });
    }
    const targetSections = sections && Array.isArray(sections) && sections.length > 0 ? sections : ['A', 'B', 'C', 'D'];

    // Fetch and sort students
    const students = await Student.find({ _id: { $in: studentIds } });
    students.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (a.studentId || '').localeCompare(b.studentId || '');
    });

    const updatedIds = [];
    for (let i = 0; i < students.length; i++) {
      const sectionIndex = Math.floor(i / groupSize) % targetSections.length;
      const assignedSection = targetSections[sectionIndex];
      const student = students[i];
      student.section = assignedSection;
      await student.save();
      updatedIds.push(student._id);
    }

    for (const id of updatedIds) {
      await syncStudentCoursesAndTeacherAssignments(id);
    }

    res.status(200).json({ success: true, message: `Successfully distributed ${students.length} students into sections.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk update semester
exports.bulkUpdateSemester = async (req, res) => {
  try {
    const { studentIds, semester } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }
    if (!semester) {
      return res.status(400).json({ success: false, message: 'semester is required' });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { semester: String(semester) } }
    );

    for (const id of studentIds) {
      await syncStudentCoursesAndTeacherAssignments(id);
    }

    res.status(200).json({ success: true, message: `Successfully updated semester to ${semester} for ${studentIds.length} students` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk promote students to next semester (increments semester)
exports.bulkPromote = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const updatedIds = [];
    for (const student of students) {
      const currentSem = parseInt(student.semester);
      if (currentSem && currentSem < 8) {
        student.semester = String(currentSem + 1);
        await student.save();
        updatedIds.push(student._id);
      }
    }

    for (const id of updatedIds) {
      await syncStudentCoursesAndTeacherAssignments(id);
    }

    res.status(200).json({ success: true, message: `Successfully promoted ${updatedIds.length} students.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Section management routes are correctly defined above.
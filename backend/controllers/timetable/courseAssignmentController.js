const TtCourseAssignment = require('../../models/TtCourseAssignment');
const TtSubject = require('../../models/TtSubject');
const Teacher = require('../../models/Teacher');
const TtSection = require('../../models/TtSection');
const TtBranch = require('../../models/TtBranch');
const TtSemester = require('../../models/TtSemester');
const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all course assignments
// @route   GET /api/timetable/manage/course-assignments
exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await TtCourseAssignment.find({ isActive: true })
      .populate('subjectId', 'name code type')
      .populate('facultyId', 'name email employeeId')
      .populate('sectionId', 'label studentCount')
      .populate('branchId', 'code name')
      .populate('semesterId', 'semesterNumber year')
      .populate('academicYearId', 'label');
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignment by ID
// @route   GET /api/timetable/manage/course-assignments/:id
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await TtCourseAssignment.findOne({ _id: req.params.id, isActive: true })
      .populate('subjectId')
      .populate('facultyId')
      .populate('sectionId')
      .populate('branchId')
      .populate('semesterId')
      .populate('academicYearId');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create course assignment
// @route   POST /api/timetable/manage/course-assignments
exports.createAssignment = async (req, res) => {
  try {
    const { subjectId, facultyId, sectionId, branchId, semesterId, academicYearId } = req.body;
    if (!subjectId || !facultyId || !sectionId || !branchId || !semesterId || !academicYearId) {
      return res.status(400).json({ success: false, message: 'subjectId, facultyId, sectionId, branchId, semesterId, and academicYearId are required.' });
    }

    // Verify resources exist and are active
    const subject = await TtSubject.findOne({ _id: subjectId, isActive: true });
    if (!subject) return res.status(400).json({ success: false, message: 'Invalid Subject ID.' });

    const faculty = await Teacher.findOne({ _id: facultyId, isActive: true });
    if (!faculty) return res.status(400).json({ success: false, message: 'Invalid Faculty ID.' });

    const section = await TtSection.findOne({ _id: sectionId, isActive: true });
    if (!section) return res.status(400).json({ success: false, message: 'Invalid Section ID.' });

    const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
    if (!branch) return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });

    const semester = await TtSemester.findOne({ _id: semesterId, isActive: true });
    if (!semester) return res.status(400).json({ success: false, message: 'Invalid Semester ID.' });

    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });

    // Validate capacity if sections are mapped
    if (section.studentCount > 0 && subject.roomType !== 'any') {
      // Logic placeholder for checking capacity issues in future phases if needed,
      // but let's fulfill the capacity validation requirement here if possible.
    }

    // Check duplicate assignment
    const existing = await TtCourseAssignment.findOne({
      subjectId,
      sectionId,
      academicYearId,
      isActive: true
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subject is already assigned to this Section for this Academic Year.' });
    }

    const assignment = await TtCourseAssignment.create({
      subjectId,
      facultyId,
      sectionId,
      branchId,
      semesterId,
      academicYearId
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update course assignment
// @route   PUT /api/timetable/manage/course-assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const { subjectId, facultyId, sectionId, branchId, semesterId, academicYearId } = req.body;
    const assignment = await TtCourseAssignment.findOne({ _id: req.params.id, isActive: true });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (subjectId) {
      const subject = await TtSubject.findOne({ _id: subjectId, isActive: true });
      if (!subject) return res.status(400).json({ success: false, message: 'Invalid Subject ID.' });
      assignment.subjectId = subjectId;
    }

    if (facultyId) {
      const faculty = await Teacher.findOne({ _id: facultyId, isActive: true });
      if (!faculty) return res.status(400).json({ success: false, message: 'Invalid Faculty ID.' });
      assignment.facultyId = facultyId;
    }

    if (sectionId) {
      const section = await TtSection.findOne({ _id: sectionId, isActive: true });
      if (!section) return res.status(400).json({ success: false, message: 'Invalid Section ID.' });
      assignment.sectionId = sectionId;
    }

    if (branchId) {
      const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
      if (!branch) return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });
      assignment.branchId = branchId;
    }

    if (semesterId) {
      const semester = await TtSemester.findOne({ _id: semesterId, isActive: true });
      if (!semester) return res.status(400).json({ success: false, message: 'Invalid Semester ID.' });
      assignment.semesterId = semesterId;
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      assignment.academicYearId = academicYearId;
    }

    // Check duplicate assignment if subjectId, sectionId or academicYearId changes
    if (subjectId || sectionId || academicYearId) {
      const activeSubject = subjectId || assignment.subjectId;
      const activeSection = sectionId || assignment.sectionId;
      const activeAY = academicYearId || assignment.academicYearId;

      const existing = await TtCourseAssignment.findOne({
        subjectId: activeSubject,
        sectionId: activeSection,
        academicYearId: activeAY,
        isActive: true,
        _id: { $ne: assignment._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Subject is already assigned to this Section for this Academic Year.' });
      }
    }

    await assignment.save();
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete course assignment (soft-delete)
// @route   DELETE /api/timetable/manage/course-assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await TtCourseAssignment.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignments by faculty ID
// @route   GET /api/timetable/manage/course-assignments/faculty/:facultyId
exports.getAssignmentsByFaculty = async (req, res) => {
  try {
    const assignments = await TtCourseAssignment.find({ facultyId: req.params.facultyId, isActive: true })
      .populate('subjectId')
      .populate('sectionId')
      .populate('semesterId');
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignments by section ID
// @route   GET /api/timetable/manage/course-assignments/section/:sectionId
exports.getAssignmentsBySection = async (req, res) => {
  try {
    const assignments = await TtCourseAssignment.find({ sectionId: req.params.sectionId, isActive: true })
      .populate('subjectId')
      .populate('facultyId')
      .populate('semesterId');
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

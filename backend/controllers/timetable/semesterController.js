const TtSemester = require('../../models/TtSemester');
const TtBranch = require('../../models/TtBranch');
const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all semesters
// @route   GET /api/timetable/manage/semesters
exports.getAllSemesters = async (req, res) => {
  try {
    const semesters = await TtSemester.find({ isActive: true })
      .populate('branchId', 'code name')
      .populate('academicYearId', 'label isCurrent')
      .sort({ branchId: 1, semesterNumber: 1 });
    res.status(200).json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get semester by ID
// @route   GET /api/timetable/manage/semesters/:id
exports.getSemesterById = async (req, res) => {
  try {
    const semester = await TtSemester.findOne({ _id: req.params.id, isActive: true })
      .populate('branchId', 'code name')
      .populate('academicYearId', 'label isCurrent');
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found.' });
    }
    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create semester
// @route   POST /api/timetable/manage/semesters
exports.createSemester = async (req, res) => {
  try {
    const { semesterNumber, branchId, academicYearId } = req.body;
    if (!semesterNumber || !branchId || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Semester number, branchId, and academicYearId are required.' });
    }

    const semNum = Number(semesterNumber);
    if (isNaN(semNum) || semNum < 1 || semNum > 10) {
      return res.status(400).json({ success: false, message: 'Semester number must be between 1 and 10.' });
    }

    // Verify Branch exists
    const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
    if (!branch) {
      return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    // Calculate year based on semester: Sem 1-2 = Year 1, Sem 3-4 = Year 2, etc.
    const year = Math.ceil(semNum / 2);

    // Check duplicate semester per branch per academic year
    const existing = await TtSemester.findOne({ branchId, semesterNumber: semNum, academicYearId, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Semester ${semNum} already exists for this Branch and Academic Year.` });
    }

    const semester = await TtSemester.create({
      semesterNumber: semNum,
      year,
      branchId,
      academicYearId
    });

    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update semester
// @route   PUT /api/timetable/manage/semesters/:id
exports.updateSemester = async (req, res) => {
  try {
    const { semesterNumber, branchId, academicYearId } = req.body;
    const semester = await TtSemester.findOne({ _id: req.params.id, isActive: true });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found.' });
    }

    if (branchId) {
      const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
      if (!branch) {
        return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });
      }
      semester.branchId = branchId;
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      }
      semester.academicYearId = academicYearId;
    }

    if (semesterNumber !== undefined) {
      const semNum = Number(semesterNumber);
      if (isNaN(semNum) || semNum < 1 || semNum > 10) {
        return res.status(400).json({ success: false, message: 'Semester number must be between 1 and 10.' });
      }

      const activeBranch = branchId || semester.branchId;
      const activeAY = academicYearId || semester.academicYearId;

      const existing = await TtSemester.findOne({
        branchId: activeBranch,
        semesterNumber: semNum,
        academicYearId: activeAY,
        isActive: true,
        _id: { $ne: semester._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Semester ${semNum} already exists for this Branch and Academic Year.` });
      }

      semester.semesterNumber = semNum;
      semester.year = Math.ceil(semNum / 2);
    }

    await semester.save();
    res.status(200).json({ success: true, data: semester });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete semester (soft-delete)
// @route   DELETE /api/timetable/manage/semesters/:id
exports.deleteSemester = async (req, res) => {
  try {
    const semester = await TtSemester.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semester not found.' });
    }
    res.status(200).json({ success: true, message: 'Semester deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get semesters by branch ID
// @route   GET /api/timetable/manage/semesters/branch/:branchId
exports.getSemestersByBranch = async (req, res) => {
  try {
    const semesters = await TtSemester.find({ branchId: req.params.branchId, isActive: true })
      .sort({ semesterNumber: 1 });
    res.status(200).json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

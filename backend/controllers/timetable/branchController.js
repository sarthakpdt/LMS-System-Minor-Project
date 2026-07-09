const TtBranch = require('../../models/TtBranch');
const TtAcademicYear = require('../../models/TtAcademicYear');
const TtDepartment = require('../../models/TtDepartment');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all branches
// @route   GET /api/timetable/manage/branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await TtBranch.find({ isActive: true })
      .populate('academicYearId', 'label isCurrent')
      .populate('departmentId', 'code name')
      .sort({ code: 1 });
    res.status(200).json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get branch by ID
// @route   GET /api/timetable/manage/branches/:id
exports.getBranchById = async (req, res) => {
  try {
    const branch = await TtBranch.findOne({ _id: req.params.id, isActive: true })
      .populate('academicYearId', 'label isCurrent')
      .populate('departmentId', 'code name');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create branch
// @route   POST /api/timetable/manage/branches
exports.createBranch = async (req, res) => {
  try {
    const { code, name, academicYearId, departmentId } = req.body;
    if (!code || !name || !academicYearId || !departmentId) {
      return res.status(400).json({ success: false, message: 'Code, name, academicYearId, and departmentId are required.' });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    // Verify Department exists
    const dept = await TtDepartment.findOne({ _id: departmentId, isActive: true });
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Invalid Department ID.' });
    }

    // Check duplicate code per academic year
    const existing = await TtBranch.findOne({ code: code.toUpperCase(), academicYearId, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Branch with code "${code.toUpperCase()}" already exists for this Academic Year.` });
    }

    const branch = await TtBranch.create({
      code: code.toUpperCase(),
      name,
      academicYearId,
      departmentId
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update branch
// @route   PUT /api/timetable/manage/branches/:id
exports.updateBranch = async (req, res) => {
  try {
    const { code, name, academicYearId, departmentId } = req.body;
    const branch = await TtBranch.findOne({ _id: req.params.id, isActive: true });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      }
      branch.academicYearId = academicYearId;
    }

    if (departmentId) {
      const dept = await TtDepartment.findOne({ _id: departmentId, isActive: true });
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Invalid Department ID.' });
      }
      branch.departmentId = departmentId;
    }

    if (code) {
      const activeAY = academicYearId || branch.academicYearId;
      const existing = await TtBranch.findOne({
        code: code.toUpperCase(),
        academicYearId: activeAY,
        isActive: true,
        _id: { $ne: branch._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Branch with code "${code.toUpperCase()}" already exists for this Academic Year.` });
      }
      branch.code = code.toUpperCase();
    }

    if (name) branch.name = name;

    await branch.save();
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete branch (soft-delete)
// @route   DELETE /api/timetable/manage/branches/:id
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await TtBranch.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }
    res.status(200).json({ success: true, message: 'Branch deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

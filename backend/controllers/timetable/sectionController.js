const TtSection = require('../../models/TtSection');
const TtSemester = require('../../models/TtSemester');
const TtBranch = require('../../models/TtBranch');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all sections
// @route   GET /api/timetable/manage/sections
exports.getAllSections = async (req, res) => {
  try {
    const sections = await TtSection.find({ isActive: true })
      .populate({
        path: 'semesterId',
        select: 'semesterNumber year',
        populate: { path: 'academicYearId', select: 'label' }
      })
      .populate('branchId', 'code name')
      .sort({ branchId: 1, semesterId: 1, label: 1 });
    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get section by ID
// @route   GET /api/timetable/manage/sections/:id
exports.getSectionById = async (req, res) => {
  try {
    const section = await TtSection.findOne({ _id: req.params.id, isActive: true })
      .populate('semesterId')
      .populate('branchId');
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create section
// @route   POST /api/timetable/manage/sections
exports.createSection = async (req, res) => {
  try {
    const { label, semesterId, branchId, studentCount } = req.body;
    if (!label || !semesterId || !branchId) {
      return res.status(400).json({ success: false, message: 'Label, semesterId, and branchId are required.' });
    }

    // Verify Semester exists
    const semester = await TtSemester.findOne({ _id: semesterId, isActive: true });
    if (!semester) {
      return res.status(400).json({ success: false, message: 'Invalid Semester ID.' });
    }

    // Verify Branch exists
    const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
    if (!branch) {
      return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });
    }

    // Check duplicate section label per semester
    const existing = await TtSection.findOne({ semesterId, label: label.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Section "${label.toUpperCase()}" already exists for this Semester.` });
    }

    const section = await TtSection.create({
      label: label.toUpperCase(),
      semesterId,
      branchId,
      studentCount: Number(studentCount) || 0
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update section
// @route   PUT /api/timetable/manage/sections/:id
exports.updateSection = async (req, res) => {
  try {
    const { label, semesterId, branchId, studentCount } = req.body;
    const section = await TtSection.findOne({ _id: req.params.id, isActive: true });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    if (semesterId) {
      const semester = await TtSemester.findOne({ _id: semesterId, isActive: true });
      if (!semester) {
        return res.status(400).json({ success: false, message: 'Invalid Semester ID.' });
      }
      section.semesterId = semesterId;
    }

    if (branchId) {
      const branch = await TtBranch.findOne({ _id: branchId, isActive: true });
      if (!branch) {
        return res.status(400).json({ success: false, message: 'Invalid Branch ID.' });
      }
      section.branchId = branchId;
    }

    if (studentCount !== undefined) {
      section.studentCount = Number(studentCount) || 0;
    }

    if (label) {
      const activeSem = semesterId || section.semesterId;
      const existing = await TtSection.findOne({
        semesterId: activeSem,
        label: label.toUpperCase(),
        isActive: true,
        _id: { $ne: section._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `Section "${label.toUpperCase()}" already exists for this Semester.` });
      }
      section.label = label.toUpperCase();
    }

    await section.save();
    res.status(200).json({ success: true, data: section });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete section (soft-delete)
// @route   DELETE /api/timetable/manage/sections/:id
exports.deleteSection = async (req, res) => {
  try {
    const section = await TtSection.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }
    res.status(200).json({ success: true, message: 'Section deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sections by semester ID
// @route   GET /api/timetable/manage/sections/semester/:semesterId
exports.getSectionsBySemester = async (req, res) => {
  try {
    const sections = await TtSection.find({ semesterId: req.params.semesterId, isActive: true })
      .sort({ label: 1 });
    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

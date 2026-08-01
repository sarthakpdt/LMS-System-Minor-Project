const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get all academic years
// @route   GET /api/timetable/manage/academic-years
exports.getAllAcademicYears = async (req, res) => {
  try {
    const years = await TtAcademicYear.find({ isActive: true }).sort({ label: 1 });
    res.status(200).json({ success: true, count: years.length, data: years });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get academic year by ID
// @route   GET /api/timetable/manage/academic-years/:id
exports.getAcademicYearById = async (req, res) => {
  try {
    const year = await TtAcademicYear.findOne({ _id: req.params.id, isActive: true });
    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }
    res.status(200).json({ success: true, data: year });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create academic year
// @route   POST /api/timetable/manage/academic-years
exports.createAcademicYear = async (req, res) => {
  try {
    const { label, startDate, endDate, isCurrent } = req.body;
    if (!label || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Label, start date, and end date are required.' });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    // Check duplicate label manually for better messaging
    const existing = await TtAcademicYear.findOne({ label, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `Academic Year "${label}" already exists.` });
    }

    const year = await TtAcademicYear.create({ label, startDate, endDate, isCurrent: !!isCurrent });

    if (isCurrent) {
      // Set all other academic years isCurrent to false
      await TtAcademicYear.updateMany({ _id: { $ne: year._id } }, { isCurrent: false });
    }

    res.status(201).json({ success: true, data: year });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update academic year
// @route   PUT /api/timetable/manage/academic-years/:id
exports.updateAcademicYear = async (req, res) => {
  try {
    const { label, startDate, endDate, isCurrent } = req.body;
    const year = await TtAcademicYear.findOne({ _id: req.params.id, isActive: true });
    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }

    if (label && label !== year.label) {
      const existing = await TtAcademicYear.findOne({ label, isActive: true, _id: { $ne: year._id } });
      if (existing) {
        return res.status(409).json({ success: false, message: `Academic Year "${label}" already exists.` });
      }
      year.label = label;
    }

    if (startDate) year.startDate = startDate;
    if (endDate) year.endDate = endDate;
    if (isCurrent !== undefined) year.isCurrent = !!isCurrent;

    await year.save();

    if (year.isCurrent) {
      await TtAcademicYear.updateMany({ _id: { $ne: year._id } }, { isCurrent: false });
    }

    res.status(200).json({ success: true, data: year });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete academic year (soft-delete)
// @route   DELETE /api/timetable/manage/academic-years/:id
exports.deleteAcademicYear = async (req, res) => {
  try {
    const year = await TtAcademicYear.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }
    res.status(200).json({ success: true, message: 'Academic Year deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set current academic year
// @route   PATCH /api/timetable/manage/academic-years/:id/set-current
exports.setCurrentAcademicYear = async (req, res) => {
  try {
    const year = await TtAcademicYear.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isCurrent: true },
      { new: true }
    );
    if (!year) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }

    await TtAcademicYear.updateMany({ _id: { $ne: year._id } }, { isCurrent: false });

    res.status(200).json({ success: true, message: `Academic Year "${year.label}" set as current.`, data: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

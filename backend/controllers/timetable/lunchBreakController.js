const TtLunchBreak = require('../../models/TtLunchBreak');
const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// @desc    Get all lunch breaks
// @route   GET /api/timetable/manage/lunch-breaks
exports.getAllLunchBreaks = async (req, res) => {
  try {
    const breaks = await TtLunchBreak.find({ isActive: true })
      .populate('academicYearId', 'label isCurrent')
      .sort({ academicYearId: 1 });
    res.status(200).json({ success: true, count: breaks.length, data: breaks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lunch break by ID
// @route   GET /api/timetable/manage/lunch-breaks/:id
exports.getLunchBreakById = async (req, res) => {
  try {
    const lunchBreak = await TtLunchBreak.findOne({ _id: req.params.id, isActive: true })
      .populate('academicYearId', 'label isCurrent');
    if (!lunchBreak) {
      return res.status(404).json({ success: false, message: 'Lunch break not found.' });
    }
    res.status(200).json({ success: true, data: lunchBreak });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create lunch break
// @route   POST /api/timetable/manage/lunch-breaks
exports.createLunchBreak = async (req, res) => {
  try {
    const { startTime, endTime, academicYearId } = req.body;
    if (!startTime || !endTime || !academicYearId) {
      return res.status(400).json({ success: false, message: 'StartTime, endTime, and academicYearId are required.' });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins >= endMins) {
      return res.status(400).json({ success: false, message: 'End time must be after start time.' });
    }

    const duration = endMins - startMins;

    // Check duplicate per academic year
    const existing = await TtLunchBreak.findOne({ academicYearId, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Lunch Break is already defined for this Academic Year. Please edit the existing entry.' });
    }

    const lunchBreak = await TtLunchBreak.create({
      startTime,
      endTime,
      duration,
      academicYearId
    });

    res.status(201).json({ success: true, data: lunchBreak });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update lunch break
// @route   PUT /api/timetable/manage/lunch-breaks/:id
exports.updateLunchBreak = async (req, res) => {
  try {
    const { startTime, endTime, academicYearId } = req.body;
    const lunchBreak = await TtLunchBreak.findOne({ _id: req.params.id, isActive: true });
    if (!lunchBreak) {
      return res.status(404).json({ success: false, message: 'Lunch break not found.' });
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      }

      const existing = await TtLunchBreak.findOne({
        academicYearId,
        isActive: true,
        _id: { $ne: lunchBreak._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Lunch Break is already defined for this Academic Year.' });
      }

      lunchBreak.academicYearId = academicYearId;
    }

    if (startTime || endTime) {
      const start = startTime || lunchBreak.startTime;
      const end = endTime || lunchBreak.endTime;

      const startMins = timeToMinutes(start);
      const endMins = timeToMinutes(end);
      if (startMins >= endMins) {
        return res.status(400).json({ success: false, message: 'End time must be after start time.' });
      }

      lunchBreak.startTime = start;
      lunchBreak.endTime = end;
      lunchBreak.duration = endMins - startMins;
    }

    await lunchBreak.save();
    res.status(200).json({ success: true, data: lunchBreak });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete lunch break (soft-delete)
// @route   DELETE /api/timetable/manage/lunch-breaks/:id
exports.deleteLunchBreak = async (req, res) => {
  try {
    const lunchBreak = await TtLunchBreak.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!lunchBreak) {
      return res.status(404).json({ success: false, message: 'Lunch break not found.' });
    }
    res.status(200).json({ success: true, message: 'Lunch break deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

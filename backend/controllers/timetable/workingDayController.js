const TtWorkingDay = require('../../models/TtWorkingDay');
const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// @desc    Get all working days
// @route   GET /api/timetable/manage/working-days
exports.getAllWorkingDays = async (req, res) => {
  try {
    const days = await TtWorkingDay.find({ isActive: true })
      .populate('academicYearId', 'label isCurrent')
      .sort({ academicYearId: 1, dayOrder: 1 });
    res.status(200).json({ success: true, count: days.length, data: days });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get working day by ID
// @route   GET /api/timetable/manage/working-days/:id
exports.getWorkingDayById = async (req, res) => {
  try {
    const day = await TtWorkingDay.findOne({ _id: req.params.id, isActive: true })
      .populate('academicYearId', 'label isCurrent');
    if (!day) {
      return res.status(404).json({ success: false, message: 'Working day not found.' });
    }
    res.status(200).json({ success: true, data: day });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create working day
// @route   POST /api/timetable/manage/working-days
exports.createWorkingDay = async (req, res) => {
  try {
    const { dayName, dayOrder, isHalfDay, academicYearId } = req.body;
    if (!dayName || !dayOrder || !academicYearId) {
      return res.status(400).json({ success: false, message: 'DayName, dayOrder, and academicYearId are required.' });
    }

    if (!VALID_DAYS.includes(dayName)) {
      return res.status(400).json({ success: false, message: `Invalid day name. Must be one of: ${VALID_DAYS.join(', ')}` });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    // Check duplicate dayName per academic year
    const existing = await TtWorkingDay.findOne({ dayName, academicYearId, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: `"${dayName}" is already configured as a working day for this Academic Year.` });
    }

    const day = await TtWorkingDay.create({
      dayName,
      dayOrder: Number(dayOrder),
      isHalfDay: !!isHalfDay,
      academicYearId
    });

    res.status(201).json({ success: true, data: day });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update working day
// @route   PUT /api/timetable/manage/working-days/:id
exports.updateWorkingDay = async (req, res) => {
  try {
    const { dayName, dayOrder, isHalfDay, academicYearId } = req.body;
    const day = await TtWorkingDay.findOne({ _id: req.params.id, isActive: true });
    if (!day) {
      return res.status(404).json({ success: false, message: 'Working day not found.' });
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      }
      day.academicYearId = academicYearId;
    }

    const activeAY = academicYearId || day.academicYearId;

    if (dayName) {
      if (!VALID_DAYS.includes(dayName)) {
        return res.status(400).json({ success: false, message: `Invalid day name. Must be one of: ${VALID_DAYS.join(', ')}` });
      }

      const existing = await TtWorkingDay.findOne({
        dayName,
        academicYearId: activeAY,
        isActive: true,
        _id: { $ne: day._id }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: `"${dayName}" is already configured as a working day for this Academic Year.` });
      }
      day.dayName = dayName;
    }

    if (dayOrder !== undefined) day.dayOrder = Number(dayOrder);
    if (isHalfDay !== undefined) day.isHalfDay = !!isHalfDay;

    await day.save();
    res.status(200).json({ success: true, data: day });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete working day (soft-delete)
// @route   DELETE /api/timetable/manage/working-days/:id
exports.deleteWorkingDay = async (req, res) => {
  try {
    const day = await TtWorkingDay.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!day) {
      return res.status(404).json({ success: false, message: 'Working day not found.' });
    }
    res.status(200).json({ success: true, message: 'Working day deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk set working days
// @route   POST /api/timetable/manage/working-days/bulk
exports.bulkSetWorkingDays = async (req, res) => {
  try {
    const { academicYearId, workingDays } = req.body; // workingDays: [{ dayName, dayOrder, isHalfDay }]
    if (!academicYearId || !Array.isArray(workingDays) || workingDays.length === 0) {
      return res.status(400).json({ success: false, message: 'AcademicYearId and non-empty workingDays array are required.' });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    // Validate all dayName values
    for (const item of workingDays) {
      if (!item.dayName || !VALID_DAYS.includes(item.dayName)) {
        return res.status(400).json({ success: false, message: `Invalid day name "${item.dayName}". Must be one of: ${VALID_DAYS.join(', ')}` });
      }
    }

    // Deactivate previous working days for this academic year
    await TtWorkingDay.updateMany({ academicYearId }, { isActive: false });

    const createdDays = [];
    for (const item of workingDays) {
      const day = await TtWorkingDay.create({
        dayName: item.dayName,
        dayOrder: Number(item.dayOrder) || 1,
        isHalfDay: !!item.isHalfDay,
        academicYearId
      });
      createdDays.push(day);
    }

    res.status(200).json({ success: true, count: createdDays.length, data: createdDays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

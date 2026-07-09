const TtLectureSlot = require('../../models/TtLectureSlot');
const TtAcademicYear = require('../../models/TtAcademicYear');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper to validate slot times and duration
function validateSlotTime(startTime, endTime, duration) {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (startMins >= endMins) {
    return 'End time must be after start time.';
  }
  const diff = endMins - startMins;
  if (duration !== undefined && Number(duration) !== diff) {
    return `Duration (${duration} mins) does not match start and end time difference (${diff} mins).`;
  }
  return null;
}

// @desc    Get all lecture slots
// @route   GET /api/timetable/manage/lecture-slots
exports.getAllLectureSlots = async (req, res) => {
  try {
    const slots = await TtLectureSlot.find({ isActive: true })
      .populate('academicYearId', 'label isCurrent')
      .sort({ slotNumber: 1 });
    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lecture slot by ID
// @route   GET /api/timetable/manage/lecture-slots/:id
exports.getLectureSlotById = async (req, res) => {
  try {
    const slot = await TtLectureSlot.findOne({ _id: req.params.id, isActive: true })
      .populate('academicYearId', 'label isCurrent');
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Lecture slot not found.' });
    }
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Create lecture slot
// @route   POST /api/timetable/manage/lecture-slots
exports.createLectureSlot = async (req, res) => {
  try {
    const { label, startTime, endTime, slotNumber, duration, isBreak, breakType, academicYearId } = req.body;
    if (!label || !startTime || !endTime || !slotNumber || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Label, startTime, endTime, slotNumber, and academicYearId are required.' });
    }

    // Verify Academic Year exists
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
    }

    const computedDuration = duration !== undefined ? Number(duration) : (timeToMinutes(endTime) - timeToMinutes(startTime));
    
    // Time validation
    const timeErr = validateSlotTime(startTime, endTime, computedDuration);
    if (timeErr) {
      return res.status(400).json({ success: false, message: timeErr });
    }

    // Check duplicate slot number per academic year
    const existingNum = await TtLectureSlot.findOne({ slotNumber, academicYearId, isActive: true });
    if (existingNum) {
      return res.status(409).json({ success: false, message: `Lecture Slot number ${slotNumber} already exists for this Academic Year.` });
    }

    const slot = await TtLectureSlot.create({
      label,
      startTime,
      endTime,
      slotNumber: Number(slotNumber),
      duration: computedDuration,
      isBreak: !!isBreak,
      breakType: isBreak ? breakType : null,
      academicYearId
    });

    res.status(201).json({ success: true, data: slot });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Update lecture slot
// @route   PUT /api/timetable/manage/lecture-slots/:id
exports.updateLectureSlot = async (req, res) => {
  try {
    const { label, startTime, endTime, slotNumber, duration, isBreak, breakType, academicYearId } = req.body;
    const slot = await TtLectureSlot.findOne({ _id: req.params.id, isActive: true });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Lecture slot not found.' });
    }

    if (academicYearId) {
      const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
      if (!ay) {
        return res.status(400).json({ success: false, message: 'Invalid Academic Year ID.' });
      }
      slot.academicYearId = academicYearId;
    }

    const activeAY = academicYearId || slot.academicYearId;

    if (startTime || endTime || duration) {
      const start = startTime || slot.startTime;
      const end = endTime || slot.endTime;
      const computedDuration = duration !== undefined ? Number(duration) : (timeToMinutes(end) - timeToMinutes(start));

      const timeErr = validateSlotTime(start, end, computedDuration);
      if (timeErr) {
        return res.status(400).json({ success: false, message: timeErr });
      }

      slot.startTime = start;
      slot.endTime = end;
      slot.duration = computedDuration;
    }

    if (slotNumber !== undefined) {
      const existingNum = await TtLectureSlot.findOne({
        slotNumber,
        academicYearId: activeAY,
        isActive: true,
        _id: { $ne: slot._id }
      });
      if (existingNum) {
        return res.status(409).json({ success: false, message: `Lecture Slot number ${slotNumber} already exists for this Academic Year.` });
      }
      slot.slotNumber = Number(slotNumber);
    }

    if (label) slot.label = label;
    if (isBreak !== undefined) {
      slot.isBreak = !!isBreak;
      slot.breakType = isBreak ? breakType : null;
    }

    await slot.save();
    res.status(200).json({ success: true, data: slot });
  } catch (error) {
    const status = mongoErrorStatus(error);
    const message = mapMongoError(error);
    res.status(status).json({ success: false, message });
  }
};

// @desc    Delete lecture slot (soft-delete)
// @route   DELETE /api/timetable/manage/lecture-slots/:id
exports.deleteLectureSlot = async (req, res) => {
  try {
    const slot = await TtLectureSlot.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Lecture slot not found.' });
    }
    res.status(200).json({ success: true, message: 'Lecture slot deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

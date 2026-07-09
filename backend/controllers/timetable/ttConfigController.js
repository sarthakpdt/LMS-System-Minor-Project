const TtAcademicYear = require('../../models/TtAcademicYear');
const TtBranch = require('../../models/TtBranch');
const TtSemester = require('../../models/TtSemester');
const TtSection = require('../../models/TtSection');
const TtLectureSlot = require('../../models/TtLectureSlot');
const TtWorkingDay = require('../../models/TtWorkingDay');
const TtLunchBreak = require('../../models/TtLunchBreak');
const TtConfig = require('../../models/TtConfig');
const { mapMongoError, mongoErrorStatus } = require('../../utils/mongoErrorMapper');

// @desc    Get aggregated config for an academic year (normalized schemas)
// @route   GET /api/timetable/manage/configs/:academicYearId
exports.getUnifiedConfig = async (req, res) => {
  try {
    const { academicYearId } = req.params;

    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }

    const branches = await TtBranch.find({ academicYearId, isActive: true });
    const semesters = await TtSemester.find({ academicYearId, isActive: true });
    const sections = await TtSection.find({ branchId: { $in: branches.map(b => b._id) }, isActive: true });
    const workingDays = await TtWorkingDay.find({ academicYearId, isActive: true }).sort({ dayOrder: 1 });
    const slots = await TtLectureSlot.find({ academicYearId, isActive: true }).sort({ slotNumber: 1 });
    const lunchBreak = await TtLunchBreak.findOne({ academicYearId, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        academicYear: ay,
        branches,
        semesters,
        sections,
        workingDays,
        timeSlots: slots,
        lunchBreak
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compile normalized entities and save/sync to legacy TtConfig (so the engine runs without modification)
// @route   POST /api/timetable/manage/configs/:academicYearId/sync
exports.syncLegacyConfig = async (req, res) => {
  try {
    const { academicYearId } = req.params;

    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true });
    if (!ay) {
      return res.status(404).json({ success: false, message: 'Academic Year not found.' });
    }

    // 1. Fetch all related entities
    const branches = await TtBranch.find({ academicYearId, isActive: true }).lean();
    const semesters = await TtSemester.find({ academicYearId, isActive: true }).lean();
    const sections = await TtSection.find({ branchId: { $in: branches.map(b => b._id) }, isActive: true }).lean();
    const workingDays = await TtWorkingDay.find({ academicYearId, isActive: true }).sort({ dayOrder: 1 }).lean();
    const slots = await TtLectureSlot.find({ academicYearId, isActive: true }).sort({ slotNumber: 1 }).lean();
    const lunchBreak = await TtLunchBreak.findOne({ academicYearId, isActive: true }).lean();

    if (workingDays.length === 0) {
      return res.status(400).json({ success: false, message: 'No working days configured for this academic year.' });
    }
    if (slots.length === 0) {
      return res.status(400).json({ success: false, message: 'No time slots configured for this academic year.' });
    }
    if (!lunchBreak) {
      return res.status(400).json({ success: false, message: 'Lunch break has not been configured for this academic year.' });
    }

    // 2. Format branch-semester-section hierarchy
    const formattedBranches = branches.map(b => {
      // Find years (1-4 or total years)
      const totalYears = b.totalYears || 4;
      const yearsArray = [];

      for (let y = 1; y <= totalYears; y++) {
        // Find semesters in this year (e.g. year 1 -> sem 1 & 2)
        const yearSems = semesters.filter(s => s.branchId.toString() === b._id.toString() && s.year === y);
        const yearSemIds = yearSems.map(s => s._id.toString());
        
        // Find sections in these semesters
        const yearSections = sections.filter(sec => yearSemIds.includes(sec.semesterId.toString()));
        const uniqueSectionLabels = [...new Set(yearSections.map(sec => sec.label))];

        yearsArray.push({
          yearNumber: y,
          label: y === 1 ? 'First Year' : y === 2 ? 'Second Year' : y === 3 ? 'Third Year' : y === 4 ? 'Fourth Year' : `${y}th Year`,
          sections: uniqueSectionLabels.length > 0 ? uniqueSectionLabels : ['A'] // default
        });
      }

      return {
        code: b.code,
        name: b.name,
        years: yearsArray
      };
    });

    // 3. Format working days
    const formattedWorkingDays = workingDays.map(wd => wd.dayName);

    // 4. Format time slots
    const formattedTimeSlots = slots.map(s => ({
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      isBreak: s.isBreak,
      breakType: s.breakType
    }));

    // Find default lecture duration (taking the first non-break slot or default to 50)
    const firstNonBreakSlot = slots.find(s => !s.isBreak);
    const lectureDuration = firstNonBreakSlot ? firstNonBreakSlot.duration : 50;

    // 5. Update/Create TtConfig
    // Deactivate all configurations
    await TtConfig.updateMany({}, { isActive: false });

    // Look for existing legacy config by academicYear label
    let legacyConfig = await TtConfig.findOne({ academicYear: ay.label });

    const configPayload = {
      academicYear: ay.label,
      branches: formattedBranches,
      workingDays: formattedWorkingDays,
      timeSlots: formattedTimeSlots,
      lunchBreak: {
        startTime: lunchBreak.startTime,
        endTime: lunchBreak.endTime
      },
      lectureDuration,
      isActive: true
    };

    if (legacyConfig) {
      legacyConfig = await TtConfig.findByIdAndUpdate(legacyConfig._id, configPayload, { new: true });
    } else {
      legacyConfig = await TtConfig.create(configPayload);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully synchronized legacy timetable configuration with normalized settings.',
      config: legacyConfig
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

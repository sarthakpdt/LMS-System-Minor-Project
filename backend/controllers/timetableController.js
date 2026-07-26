const TtConfig = require('../models/TtConfig');
const TtSubject = require('../models/TtSubject');
const TtRoom = require('../models/TtRoom');
const TtFacultyConstraint = require('../models/TtFacultyConstraint');
const TtGenerated = require('../models/TtGenerated');
const TtPublished = require('../models/TtPublished');
const TtAttendanceSlot = require('../models/TtAttendanceSlot');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Course = require('../models/Course');
const SchedulingEngine = require('../services/SchedulingEngine');
const TimetableOptimizer = require('../services/TimetableOptimizer');
const { mapMongoError, mongoErrorStatus } = require('../utils/mongoErrorMapper');

// ─── Helper: get the next N weekday dates for a given day name ─────────────
const getNextDatesForDay = (dayName, weeksAhead = 4) => {
  const dayIndex = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(dayName);
  if (dayIndex === -1) return [];
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let w = 0; w < weeksAhead; w++) {
    const d = new Date(today);
    const diff = (dayIndex - d.getDay() + 7) % 7 || (w === 0 ? 7 : 0);
    d.setDate(d.getDate() + diff + w * 7);
    // Only include future or today
    if (d >= today) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return [...new Set(dates)]; // dedupe
};

// ─── Helper: auto-create TtAttendanceSlot docs after publish ─────────────────
const autoCreateAttendanceSlots = async (draft, config) => {
  try {
    const WEEKS_AHEAD = 4;
    const ops = [];

    for (const entry of draft.entries) {
      if (entry.isFree || entry.isLunch || !entry.subjectId || !entry.facultyId) continue;

      const dates = getNextDatesForDay(entry.day, WEEKS_AHEAD);
      for (const date of dates) {
        ops.push({
          updateOne: {
            filter: {
              date,
              day: entry.day,
              startTime: entry.timeSlot.startTime,
              facultyId: entry.facultyId,
              // Use a string-based sectionId fallback so ObjectId is not required
              sectionLabel: `${entry.branch}-${entry.year}-${entry.section || 'A'}`,
            },
            update: {
              $set: {
                timetableEntryRef: draft._id,
                date,
                day: entry.day,
                startTime: entry.timeSlot.startTime,
                endTime: entry.timeSlot.endTime,
                subjectName: entry.subjectName,
                subjectId: entry.subjectId || null,
                facultyId: entry.facultyId,
                facultyName: entry.facultyName || '',
                branch: entry.branch,
                year: entry.year,
                section: entry.section || 'A',
                room: entry.roomName || '',
                lectureType: entry.subjectType || 'theory',
                sectionLabel: `${entry.branch}-${entry.year}-${entry.section || 'A'}`,
                attendanceStatus: 'pending',
                isActive: true,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length > 0) {
      // Use the flexible model if TtAttendanceSlot unique index conflicts
      try {
        await TtAttendanceSlot.bulkWrite(ops, { ordered: false });
      } catch (bulkErr) {
        // Log but don't fail publish — attendance slots are supplementary
        console.warn('[autoCreateAttendanceSlots] Some slots skipped:', bulkErr.message);
      }
    }
    console.log(`[autoCreateAttendanceSlots] Created/updated ${ops.length} attendance slots`);
  } catch (err) {
    console.error('[autoCreateAttendanceSlots] Error:', err.message);
    // Non-fatal — don't throw
  }
};

const stripConfigMeta = (body = {}) => {
  const { __v, createdAt, updatedAt, ...rest } = body;
  return rest;
};

const validateConfigPayload = (data) => {
  if (!data.academicYear?.trim()) {
    return 'Academic year is required.';
  }
  if (!Array.isArray(data.branches) || data.branches.length === 0) {
    return 'At least one branch is required.';
  }
  if (!Array.isArray(data.workingDays) || data.workingDays.length === 0) {
    return 'At least one working day is required.';
  }
  if (!Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
    return 'At least one time slot is required.';
  }
  for (const slot of data.timeSlots) {
    if (!slot.startTime || !slot.endTime) {
      return 'All time slots must have start and end times.';
    }
    if (slot.startTime >= slot.endTime) {
      return `Invalid time slot: end time must be after start time (${slot.label || 'unnamed slot'}).`;
    }
  }
  if (!data.lunchBreak?.startTime || !data.lunchBreak?.endTime) {
    return 'Lunch period start and end times are required.';
  }
  return null;
};

const upsertActiveConfig = async (body) => {
  const payload = stripConfigMeta(body);
  const { _id, ...configData } = payload;

  const validationError = validateConfigPayload(configData);
  if (validationError) {
    const err = new Error(validationError);
    err.name = 'ValidationError';
    throw err;
  }

  if (_id) {
    await TtConfig.updateMany({ _id: { $ne: _id } }, { isActive: false });
    let config = await TtConfig.findByIdAndUpdate(
      _id,
      { ...configData, isActive: true },
      { new: true, runValidators: true },
    );
    if (!config) {
      await TtConfig.updateMany({}, { isActive: false });
      config = await TtConfig.create({ ...configData, isActive: true });
    }
    return config;
  }

  await TtConfig.updateMany({}, { isActive: false });
  return TtConfig.create({ ...configData, isActive: true });
};

const DEPT_ENUM = ['CS', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CH', 'BT', 'MBA', 'MCA', 'Other'];

const toDepartment = (branch) => (DEPT_ENUM.includes(branch) ? branch : 'Other');

const semesterForYear = (year) => {
  const map = { 1: '1', 2: '3', 3: '5', 4: '7' };
  return map[year] || String(year);
};

const resolveFacultyName = async (facultyId) => {
  if (!facultyId) return '';
  const teacher = await Teacher.findById(facultyId).lean();
  return teacher?.name || '';
};

const ensureCourseForSubject = async (subject) => {
  const semester = subject.semester ? String(subject.semester) : semesterForYear(subject.year);
  const department = toDepartment(subject.branch);

  let course = null;
  if (subject.linkedCourseId) {
    course = await Course.findById(subject.linkedCourseId);
  }
  if (!course) {
    course = await Course.findOne({
      ttSubjectId: subject._id,
      isActive: { $ne: false },
    });
  }
  if (!course) {
    course = await Course.findOne({
      courseCode: subject.code,
      timetableBranch: subject.branch,
      academicYear: subject.year,
    });
  }

  const payload = {
    courseCode: subject.code,
    courseName: subject.name,
    department,
    semester: String(subject.semester),
    credits: subject.credits || 4,
    type: subject.type || 'theory',
    timetableBranch: subject.branch,
    academicYear: null,
    teacher: subject.facultyId || null,
    ttSubjectId: subject._id,
    isActive: true,
  };

  if (!course) {
    try {
      course = await Course.create(payload);
      await TtSubject.findByIdAndUpdate(subject._id, { linkedCourseId: course._id });
    } catch (err) {
      if (err.code === 11000) {
        throw new Error(`A course with code "${subject.code}" already exists in ${department} Semester ${subject.semester}`);
      }
      throw err;
    }
  } else {
    course = await Course.findByIdAndUpdate(course._id, payload, { new: true });
    if (!subject.linkedCourseId) {
      await TtSubject.findByIdAndUpdate(subject._id, { linkedCourseId: course._id });
    }
  }

  return course;
};

const buildValidationSummary = (conflicts) => {
  const summary = {
    errorCount: 0,
    warningCount: 0,
    missingFaculty: 0,
    missingRoom: 0,
    missingLab: 0,
    constraintViolations: 0,
  };

  (conflicts || []).forEach((c) => {
    if (c.severity === 'error') summary.errorCount += 1;
    else summary.warningCount += 1;

    if (c.type === 'missing' && /faculty/i.test(c.description)) {
      summary.missingFaculty += 1;
    }
    if (c.type === 'missing' && /room/i.test(c.description)) {
      summary.missingRoom += 1;
    }
    if (c.type === 'lab' || (c.type === 'missing' && /lab/i.test(c.description))) {
      summary.missingLab += 1;
    }
    if (c.type === 'unassigned' || c.type === 'section') {
      summary.constraintViolations += 1;
    }
  });

  return summary;
};

const validateBeforeGenerate = (config, subjects, rooms) => {
  const issues = [];

  if (!config?.branches?.length) {
    issues.push({ type: 'config', message: 'No branches configured.' });
  }
  if (!config?.timeSlots?.length) {
    issues.push({ type: 'config', message: 'No time slots configured.' });
  }
  if (!subjects.length) {
    issues.push({ type: 'subjects', message: 'No active subjects/courses found.' });
  }
  if (!rooms.length) {
    issues.push({ type: 'rooms', message: 'No active rooms found.' });
  }

  const subjectsWithoutFaculty = subjects.filter((s) => !s.facultyId);
  subjectsWithoutFaculty.forEach((s) => {
    issues.push({
      type: 'missing',
      message: `Missing faculty for ${s.name} (${s.code})`,
      severity: 'warning',
    });
  });

  return issues;
};

const upsertSubjectRecord = async (payload) => {
  const {
    id, _id, name, code, type, branch, semester, credits, weeklyHours, labDuration,
    lectureDuration, facultyId, hasLab, labSessionsPerWeek,
    preferredDays, preferredSlots, roomType,
  } = payload;
  const recordId = id || _id;

  const facultyName = await resolveFacultyName(facultyId);
  const base = {
    name,
    code: String(code).toUpperCase(),
    type,
    branch: String(branch).toUpperCase(),
    semester: Number(semester),
    credits: Number(credits) || 4,
    weeklyHours: Number(weeklyHours),
    labDuration: Number(labDuration) || 2,
    lectureDuration: lectureDuration ? Number(lectureDuration) : null,
    facultyId: facultyId || null,
    facultyName,
    hasLab: Boolean(hasLab),
    labSessionsPerWeek: Number(labSessionsPerWeek) || 1,
    preferredDays: Array.isArray(preferredDays) ? preferredDays : [],
    preferredSlots: Array.isArray(preferredSlots) ? preferredSlots : [],
    roomType: roomType || (type === 'lab' ? 'lab' : 'classroom'),
    isActive: true,
  };

  let subject;
  if (recordId) {
    subject = await TtSubject.findByIdAndUpdate(recordId, base, { new: true });
  } else {
    subject = await TtSubject.create(base);
  }

  if (subject && facultyId) {
    await ensureCourseForSubject(subject);
  }

  if (subject && hasLab && type === 'theory') {
    const labCode = `${subject.code}-LAB`;
    let labSubject = await TtSubject.findOne({
      code: labCode,
      branch: subject.branch,
      semester: subject.semester,
      isActive: true,
    });
    const labBase = {
      name: `${subject.name} Lab`,
      code: labCode,
      type: 'lab',
      branch: subject.branch,
      semester: subject.semester,
      credits: subject.credits || 2,
      weeklyHours: Number(labSessionsPerWeek) || 1,
      labDuration: Number(labDuration) || 2,
      facultyId: facultyId || null,
      facultyName,
      isActive: true,
    };
    if (labSubject) {
      labSubject = await TtSubject.findByIdAndUpdate(labSubject._id, labBase, { new: true });
    } else {
      labSubject = await TtSubject.create(labBase);
    }
    if (labSubject && facultyId) {
      await ensureCourseForSubject(labSubject);
    }
  }

  return subject;
};

// ── GET /api/timetable/engine/config ──
exports.getActiveConfig = async (req, res) => {
  try {
    let config = await TtConfig.findOne({ isActive: true });
    if (!config) {
      // Create a default one if it doesn't exist to avoid empty crashes
      config = await TtConfig.create({
        academicYear: '2024-25',
        branches: [
          {
            code: 'CS',
            name: 'Computer Science & Engineering',
            years: [
              { yearNumber: 1, label: 'First Year', sections: ['A', 'B'] },
              { yearNumber: 2, label: 'Second Year', sections: ['A', 'B'] },
              { yearNumber: 3, label: 'Third Year', sections: ['A'] },
              { yearNumber: 4, label: 'Fourth Year', sections: ['A'] }
            ]
          }
        ],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timeSlots: [
          { label: '09:00 - 10:00', startTime: '09:00', endTime: '10:00', isBreak: false },
          { label: '10:00 - 11:00', startTime: '10:00', endTime: '11:00', isBreak: false },
          { label: '11:00 - 12:00', startTime: '11:00', endTime: '12:00', isBreak: false },
          { label: '12:00 - 14:00', startTime: '12:00', endTime: '14:00', isBreak: true, breakType: 'lunch' },
          { label: '14:00 - 15:00', startTime: '14:00', endTime: '15:00', isBreak: false },
          { label: '15:00 - 16:00', startTime: '15:00', endTime: '16:00', isBreak: false },
          { label: '16:00 - 17:00', startTime: '16:00', endTime: '17:00', isBreak: false }
        ],
        lunchBreak: { startTime: '12:00', endTime: '14:00' },
        lectureDuration: 60,
        isActive: true
      });
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/config ──
exports.saveConfig = async (req, res) => {
  try {
    const config = await upsertActiveConfig(req.body);
    res.json({ success: true, config });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : mongoErrorStatus(err);
    const message = err.name === 'ValidationError' ? err.message : mapMongoError(err);
    res.status(status).json({ success: false, message });
  }
};

// ── PUT /api/timetable/engine/config/:id ──
exports.updateConfig = async (req, res) => {
  try {
    const config = await upsertActiveConfig({ ...req.body, _id: req.params.id });
    res.json({ success: true, config });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : mongoErrorStatus(err);
    const message = err.name === 'ValidationError' ? err.message : mapMongoError(err);
    res.status(status).json({ success: false, message });
  }
};

// ── GET /api/timetable/engine/subjects ──
exports.getSubjects = async (req, res) => {
  try {
    const branch = req.query.branch ? String(req.query.branch).toUpperCase() : null;
    // Support both semester and year query params during transition
    const semester = req.query.semester ? Number(req.query.semester) : (req.query.year ? Number(req.query.year) : null);

    if (branch && semester) {
      // 1. Fetch active Admin courses matching the branch and semester
      const adminCourses = await Course.find({
        isActive: true,
        $or: [{ timetableBranch: branch }, { department: branch }],
        semester: String(semester)
      }).populate('teacher', 'name').lean();

      // 2. Sync to TtSubject
      for (const course of adminCourses) {
        let existing = await TtSubject.findOne({ linkedCourseId: course._id });
        
        if (!existing) {
          existing = await TtSubject.findOne({ 
            code: course.courseCode, 
            branch: branch, 
            semester: semester 
          });
          
          if (existing) {
            existing.linkedCourseId = course._id;
            if (course.teacher && !existing.facultyId) {
              existing.facultyId = course.teacher._id;
              existing.facultyName = course.teacher.name;
            }
            await existing.save();
          } else {
            // Create new TtSubject from Admin Course
            await TtSubject.create({
              linkedCourseId: course._id,
              name: course.courseName,
              code: course.courseCode,
              type: course.type || 'theory',
              branch: branch,
              semester: semester,
              credits: course.credits || 4,
              weeklyHours: 3,
              labDuration: 2,
              facultyId: course.teacher ? course.teacher._id : null,
              facultyName: course.teacher ? course.teacher.name : '',
              hasLab: false,
              labSessionsPerWeek: 1,
              isActive: true
            });
          }
        } else {
           // Optionally update faculty if changed
           if (course.teacher && String(existing.facultyId) !== String(course.teacher._id)) {
              existing.facultyId = course.teacher._id;
              existing.facultyName = course.teacher.name;
              await existing.save();
           }
        }
      }
    }

    const filter = { isActive: true };
    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;
    const subjects = await TtSubject.find(filter).sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/subjects ──
exports.saveSubject = async (req, res) => {
  try {
    const subject = await upsertSubjectRecord(req.body);
    res.json({ success: true, subject });
  } catch (err) {
    res.status(mongoErrorStatus(err)).json({ success: false, message: mapMongoError(err) });
  }
};

exports.saveSubjectsBulk = async (req, res) => {
  try {
    const { branch, semester, subjects } = req.body;
    if (!branch || !semester || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'branch, semester, and subjects array are required.',
      });
    }

    const saved = [];
    for (const row of subjects) {
      const subject = await upsertSubjectRecord({
        ...row,
        branch: row.branch || branch,
        semester: row.semester || semester,
      });
      saved.push(subject);
    }

    res.json({ success: true, subjects: saved, count: saved.length });
  } catch (err) {
    res.status(mongoErrorStatus(err)).json({ success: false, message: mapMongoError(err) });
  }
};

// ── DELETE /api/timetable/engine/subjects/:id ──
exports.deleteSubject = async (req, res) => {
  try {
    await TtSubject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/subjects/:id/duplicate ──
exports.duplicateSubject = async (req, res) => {
  try {
    const source = await TtSubject.findById(req.params.id);
    if (!source || !source.isActive) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const baseCode = source.code.replace(/-COPY\d*$/i, '');
    let suffix = 1;
    let newCode = `${baseCode}-COPY${suffix}`;
    while (
      await TtSubject.findOne({
        code: newCode,
        branch: source.branch,
        year: source.year,
        isActive: true,
      })
    ) {
      suffix += 1;
      newCode = `${baseCode}-COPY${suffix}`;
    }

    const duplicate = await TtSubject.create({
      name: `${source.name} (Copy)`,
      code: newCode,
      type: source.type,
      branch: source.branch,
      year: source.year,
      weeklyHours: source.weeklyHours,
      labDuration: source.labDuration,
      lectureDuration: source.lectureDuration,
      hasLab: source.hasLab,
      labSessionsPerWeek: source.labSessionsPerWeek,
      facultyId: source.facultyId,
      facultyName: source.facultyName,
      preferredDays: source.preferredDays || [],
      preferredSlots: source.preferredSlots || [],
      roomType: source.roomType || 'any',
      isActive: true,
    });

    res.json({ success: true, subject: duplicate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/rooms ──
exports.getRooms = async (req, res) => {
  try {
    const rooms = await TtRoom.find({ isActive: true });
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/rooms ──
exports.saveRoom = async (req, res) => {
  try {
    const { id, name, type, capacity, labType } = req.body;
    let room;
    if (id) {
      room = await TtRoom.findByIdAndUpdate(id, { name, type, capacity, labType }, { new: true });
    } else {
      room = await TtRoom.create({ name, type, capacity, labType });
    }
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/timetable/engine/rooms/:id ──
exports.deleteRoom = async (req, res) => {
  try {
    await TtRoom.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/faculty-constraints ──
exports.getFacultyConstraints = async (req, res) => {
  try {
    const constraints = await TtFacultyConstraint.find();
    res.json({ success: true, constraints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/faculty-constraints ──
exports.saveFacultyConstraint = async (req, res) => {
  try {
    const { facultyId, unavailableSlots, maxHoursPerDay, maxHoursPerWeek } = req.body;
    const teacher = await Teacher.findById(facultyId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const constraint = await TtFacultyConstraint.findOneAndUpdate(
      { facultyId },
      { facultyId, facultyName: teacher.name, unavailableSlots, maxHoursPerDay, maxHoursPerWeek },
      { new: true, upsert: true }
    );

    res.json({ success: true, constraint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/teachers ──
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({ approvalStatus: 'approved' });
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/generate ──
exports.generateTimetable = async (req, res) => {
  try {
    const { timetableId } = req.body || {};
    const config = await TtConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(400).json({ success: false, message: 'No active timetable configuration found.' });
    }

    // Load and count approved students per branch, year, section
    const studentsList = await Student.find({ approvalStatus: 'approved', isActive: { $ne: false } }, 'department semester section');
    const studentCounts = {};
    studentsList.forEach(s => {
      const sem = Number(s.semester) || 1;
      const year = Math.ceil(sem / 2);
      const key = `${s.department}::${year}::${s.section || 'A'}`;
      studentCounts[key] = (studentCounts[key] || 0) + 1;
    });
    config.studentCounts = studentCounts;

    const subjects = await TtSubject.find({ isActive: true });
    const rooms = await TtRoom.find({ isActive: true });
    const constraints = await TtFacultyConstraint.find();

    const validationIssues = validateBeforeGenerate(config, subjects, rooms);
    const blocking = validationIssues.filter((i) => i.severity !== 'warning' && i.type !== 'missing');
    if (blocking.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Configuration validation failed.',
        validationIssues: blocking,
      });
    }

    const engineResult = SchedulingEngine.generate(config, subjects, rooms, constraints);
    const optimized = TimetableOptimizer.optimize(
      engineResult.entries,
      subjects,
      constraints,
      config
    );

    const conflicts = optimized.conflicts;
    const validationSummary = buildValidationSummary(conflicts);

    await TtGenerated.deleteMany({ configId: config._id, isWorkingDraft: true });

    const label = `Generated ${new Date().toLocaleString()}`;
    const draft = await TtGenerated.create({
      configId: config._id,
      status: 'draft',
      label,
      isWorkingDraft: true,
      aiOptimized: optimized.optimized,
      validationSummary,
      conflicts,
      entries: optimized.entries,
    });

    if (timetableId) {
      await TtGenerated.findByIdAndUpdate(timetableId, {
        entries: optimized.entries,
        conflicts,
        validationSummary,
        aiOptimized: optimized.optimized,
        generatedAt: new Date(),
      });
    }

    res.json({
      success: true,
      draftId: draft._id,
      conflicts,
      entries: optimized.entries,
      validationSummary,
      validationIssues,
      aiOptimized: optimized.optimized,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/timetables ──
exports.listTimetables = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const timetables = await TtGenerated.find(filter)
      .sort({ updatedAt: -1 })
      .select('label status isWorkingDraft aiOptimized validationSummary generatedAt createdAt updatedAt configId');

    res.json({ success: true, timetables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/timetables/:id ──
exports.getTimetableById = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found.' });
    }
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/timetables/save ──
exports.saveTimetable = async (req, res) => {
  try {
    const { draftId, label, entries, conflicts, cloneFromId } = req.body;

    const config = await TtConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(400).json({ success: false, message: 'No active configuration found.' });
    }

    if (cloneFromId) {
      const sourceToClone = await TtGenerated.findById(cloneFromId);
      if (!sourceToClone) {
        return res.status(404).json({ success: false, message: 'Source timetable to clone not found.' });
      }
      const cloned = await TtGenerated.create({
        configId: config._id,
        label: label || `${sourceToClone.label} (Clone)`,
        status: 'draft',
        isWorkingDraft: false,
        aiOptimized: sourceToClone.aiOptimized,
        validationSummary: sourceToClone.validationSummary,
        conflicts: sourceToClone.conflicts,
        entries: sourceToClone.entries,
      });
      return res.json({ success: true, timetable: cloned, message: 'Timetable cloned successfully.' });
    }

    if (!draftId && (!entries || !Array.isArray(entries))) {
      return res.status(400).json({
        success: false,
        message: 'draftId or entries array is required.',
      });
    }

    let source = draftId ? await TtGenerated.findById(draftId) : null;
    const payloadEntries = entries || source?.entries || [];
    const payloadConflicts = conflicts || source?.conflicts || [];
    const validationSummary = buildValidationSummary(payloadConflicts);

    if (source && !label) {
      source.entries = payloadEntries;
      source.conflicts = payloadConflicts;
      source.validationSummary = validationSummary;
      source.isWorkingDraft = false;
      await source.save();
      return res.json({ success: true, timetable: source, message: 'Timetable saved.' });
    }

    const saved = await TtGenerated.create({
      configId: config._id,
      label: label || `Saved ${new Date().toLocaleString()}`,
      status: 'draft',
      isWorkingDraft: false,
      aiOptimized: source?.aiOptimized || false,
      validationSummary,
      conflicts: payloadConflicts,
      entries: payloadEntries,
    });

    res.json({ success: true, timetable: saved, message: 'Timetable saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/timetable/engine/timetables/:id ──
exports.updateTimetable = async (req, res) => {
  try {
    const { label, entries, conflicts, status } = req.body;
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found.' });
    }

    if (label !== undefined) timetable.label = label;
    if (entries !== undefined) timetable.entries = entries;
    if (conflicts !== undefined) {
      timetable.conflicts = conflicts;
      timetable.validationSummary = buildValidationSummary(conflicts);
    }
    if (status !== undefined) timetable.status = status;

    await timetable.save();
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/timetable/engine/timetables/:id ──
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found.' });
    }

    if (timetable.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a published timetable. Archive it instead.',
      });
    }

    await TtGenerated.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Timetable deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/timetable/engine/publish ──
exports.publishTimetable = async (req, res) => {
  try {
    const { draftId } = req.body;
    const draft = await TtGenerated.findById(draftId);
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found.' });
    }

    const config = await TtConfig.findById(draft.configId);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Associated configuration not found.' });
    }

    // Mark previous published timetables as archived
    await TtGenerated.updateMany({ configId: draft.configId, status: 'published' }, { status: 'archived' });
    await TtPublished.deleteMany({ academicYear: config.academicYear });

    // Update draft status
    draft.status = 'published';
    await draft.save();

    // Create published record
    const published = await TtPublished.create({
      generatedId: draft._id,
      academicYear: config.academicYear,
      entries: draft.entries
    });

    // operational sync
    const TimetableSlot = require('../models/Timetable');
    
    // Clear old operational slots matching this published draft's branches/semesters
    const uniqueBranches = [...new Set(draft.entries.map(e => e.branch))];
    const uniqueYears = [...new Set(draft.entries.map(e => e.year))];
    const uniqueSemesters = uniqueYears.map(y => Number(semesterForYear(y)));

    await TimetableSlot.deleteMany({
      department: { $in: uniqueBranches },
      semester: { $in: uniqueSemesters }
    });

    // Write entries to TimetableSlot
    const slotsToCreate = [];
    draft.entries.forEach(entry => {
      if (entry.isFree || entry.isLunch || !entry.subjectName || !entry.facultyId) return;

      slotsToCreate.push({
        subject: entry.subjectName,
        day: entry.day,
        startTime: entry.timeSlot.startTime,
        endTime: entry.timeSlot.endTime,
        semester: Number(semesterForYear(entry.year)),
        department: entry.branch,
        section: entry.section || 'A', // Support section tracking
        teacherId: entry.facultyId,
        teacherName: entry.facultyName || '',
        room: entry.roomName || '',
        isActive: true
      });
    });

    if (slotsToCreate.length > 0) {
      await TimetableSlot.insertMany(slotsToCreate);
    }

    // ── Phase 5: Auto-create attendance slots for next 4 weeks ──
    await autoCreateAttendanceSlots(draft, config);

    res.json({ success: true, message: 'Timetable published successfully!', published });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/draft ──
exports.getLatestDraft = async (req, res) => {
  try {
    let draft = await TtGenerated.findOne({ isWorkingDraft: true }).sort({ createdAt: -1 });
    if (!draft) {
      draft = await TtGenerated.findOne({ status: 'draft' }).sort({ createdAt: -1 });
    }
    if (!draft) {
      return res.json({ success: true, draft: null });
    }
    res.json({ success: true, draft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/published ──
exports.getPublished = async (req, res) => {
  try {
    const { branch, semester, section, facultyId, roomId } = req.query;
    const published = await TtPublished.findOne().sort({ createdAt: -1 });
    if (!published) {
      return res.json({ success: true, entries: [] });
    }

    let filteredEntries = published.entries;

    if (branch) filteredEntries = filteredEntries.filter(e => e.branch === branch);
    if (semester) filteredEntries = filteredEntries.filter(e => e.semester === Number(semester));
    if (section) filteredEntries = filteredEntries.filter(e => e.section === section);
    if (facultyId) filteredEntries = filteredEntries.filter(e => e.facultyId && e.facultyId.toString() === facultyId);
    if (roomId) filteredEntries = filteredEntries.filter(e => e.roomId && e.roomId.toString() === roomId);

    res.json({ success: true, entries: filteredEntries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/timetable/engine/published/student/:studentId ──
exports.getPublishedForStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      // If a non-student (like an admin) views the portal, return an empty preview
      return res.json({ 
        success: true, 
        entries: [], 
        studentMeta: { department: 'Preview', timetableBranch: 'Preview', section: 'A', semester: 1 } 
      });
    }

    const published = await TtPublished.findOne().sort({ createdAt: -1 });
    if (!published) {
      return res.json({ success: true, entries: [] });
    }

    // Match department to branch (e.g. CS -> CS) and filter by semester directly.
    const semesterNum = Number(student.semester);
    const branch = student.timetableBranch || student.department;
    let filteredEntries = published.entries.filter(
      (e) => e.branch === branch && e.semester === semesterNum,
    );
    if (student.section) {
      filteredEntries = filteredEntries.filter((e) => e.section === student.section);
    }

    res.json({
      success: true,
      entries: filteredEntries,
      studentMeta: {
        department: student.department,
        timetableBranch: branch,
        section: student.section,
        semester: student.semester,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentsForAssignment = async (req, res) => {
  try {
    const { branch, semester, section, department } = req.query;
    const filter = { approvalStatus: 'approved', isActive: { $ne: false } };

    if (department) filter.department = department;
    if (branch) filter.timetableBranch = branch;
    if (section) filter.section = section;

    if (semester) {
      filter.semester = String(semester);
    }

    const students = await Student.find(filter)
      .select('_id name email studentId department semester section timetableBranch enrolledCourses')
      .lean();

    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignStudents = async (req, res) => {
  try {
    const { branch, section, assignments } = req.body;

    if (!branch || !section || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'branch, section, and assignments array are required.',
      });
    }

    const results = [];

    for (const item of assignments) {
      const { studentId, subjectIds } = item;
      if (!studentId) continue;

      const student = await Student.findById(studentId);
      if (!student) continue;

      student.timetableBranch = String(branch).toUpperCase();
      student.section = String(section).toUpperCase();

      const enrolled = [...(student.enrolledCourses || [])];
      const enrolledIds = new Set(enrolled.map((e) => String(e.courseId)));

      if (Array.isArray(subjectIds)) {
        for (const subjectId of subjectIds) {
          const subject = await TtSubject.findById(subjectId);
          if (!subject || !subject.isActive) continue;

          const course = await ensureCourseForSubject(subject);
          if (!enrolledIds.has(String(course._id))) {
            enrolled.push({
              courseId: course._id,
              courseCode: course.courseCode,
              courseName: course.courseName,
              semester: course.semester,
              department: course.department,
            });
            enrolledIds.add(String(course._id));
          }

          await Course.findByIdAndUpdate(course._id, {
            $addToSet: { enrolledStudents: student._id },
            section: student.section,
            timetableBranch: student.timetableBranch,
          });
        }
      }

      student.enrolledCourses = enrolled;
      await student.save();
      results.push({ studentId: student._id, section: student.section, courses: enrolled.length });
    }

    res.json({ success: true, updated: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

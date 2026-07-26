/**
 * Phase 3 — Timetable Generation Controller
 * Orchestrates AI generation without modifying backend/services/*
 */
const mongoose = require('mongoose');
const TtConfig = require('../models/TtConfig');
const TtSubject = require('../models/TtSubject');
const TtRoom = require('../models/TtRoom');
const TtFacultyConstraint = require('../models/TtFacultyConstraint');
const TtGenerated = require('../models/TtGenerated');
const TtPublished = require('../models/TtPublished');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const GenerationEngine = require('../utils/timetableGenerationEngine');
const ConflictDetector = require('../services/ConflictDetector');

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
    if (c.type === 'missing' && /faculty/i.test(c.description)) summary.missingFaculty += 1;
    if (c.type === 'missing' && /room/i.test(c.description)) summary.missingRoom += 1;
    if (c.type === 'lab' || (c.type === 'missing' && /lab/i.test(c.description))) summary.missingLab += 1;
    if (c.type === 'unassigned' || c.type === 'section') summary.constraintViolations += 1;
  });
  return summary;
};

const validateBeforeGenerate = (config, subjects, rooms) => {
  const issues = [];
  if (!config?.branches?.length) issues.push({ type: 'config', message: 'No branches configured.' });
  if (!config?.timeSlots?.length) issues.push({ type: 'config', message: 'No time slots configured.' });
  if (!subjects.length) issues.push({ type: 'subjects', message: 'No active subjects found.' });
  if (!rooms.length) issues.push({ type: 'rooms', message: 'No active rooms found.' });
  
  subjects.filter((s) => !s.facultyId).forEach((s) => {
    issues.push({ type: 'missing', message: `Missing faculty for ${s.name} (${s.code})`, severity: 'warning' });
  });

  // Validate subject mappings (Branch and Semester)
  subjects.forEach((s) => {
    if (!s.branch) {
      issues.push({ type: 'mapping', message: `Subject ${s.name} (${s.code}) is missing a branch definition.`, severity: 'error' });
      return;
    }
    if (!s.semester) {
      issues.push({ type: 'mapping', message: `Subject ${s.name} (${s.code}) is missing a semester definition.`, severity: 'error' });
      return;
    }
    const branchInConfig = (config.branches || []).find(b => b.code.toUpperCase() === s.branch.toUpperCase());
    if (!branchInConfig) {
      issues.push({ type: 'mapping', message: `Subject ${s.name} (${s.code}) maps to branch "${s.branch}", which is not present in configuration.`, severity: 'error' });
      return;
    }
    const semesterInConfig = branchInConfig.semesters.find(sem => sem.semesterNumber === s.semester);
    if (!semesterInConfig) {
      issues.push({ type: 'mapping', message: `Subject ${s.name} (${s.code}) maps to Semester ${s.semester}, which is not configured for branch ${s.branch}.`, severity: 'error' });
    }
  });

  return issues;
};

const runValidationForTimetable = async (entries, configId) => {
  const config = await TtConfig.findById(configId).lean();
  if (!config) return { conflicts: [], validationSummary: buildValidationSummary([]) };

  const context = await GenerationEngine.loadGenerationContext();
  config.studentCounts = context.config.studentCounts;

  const rooms = await TtRoom.find({ isActive: true }).lean();
  const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));
  entries.forEach((e) => {
    if (e.roomId) {
      const rm = roomMap.get(String(e.roomId));
      if (rm) {
        e.roomCapacity = rm.capacity;
        e.roomName = rm.name;
      }
    }
  });

  const subjects = await TtSubject.find({ isActive: true }).lean();
  const facultyConstraints = await TtFacultyConstraint.find().lean();
  const conflicts = ConflictDetector.validate(entries, subjects, facultyConstraints, config);
  return { conflicts, validationSummary: buildValidationSummary(conflicts) };
};

const persistGeneratedTimetable = async ({
  config,
  entries,
  conflicts,
  validationSummary,
  aiOptimized,
  generationReport,
  generationScope,
  parentTimetable = null,
  label,
  isWorkingDraft = true,
}) => {
  const versionGroupId = parentTimetable?.versionGroupId || parentTimetable?._id || new mongoose.Types.ObjectId();
  const version = (parentTimetable?.version || 0) + 1;

  if (isWorkingDraft) {
    await TtGenerated.deleteMany({ configId: config._id, isWorkingDraft: true });
  }

  return TtGenerated.create({
    configId: config._id,
    status: 'draft',
    label: label || `Generated v${version} — ${new Date().toLocaleString()}`,
    isWorkingDraft,
    aiOptimized: Boolean(aiOptimized),
    validationSummary,
    conflicts,
    entries,
    version,
    versionGroupId,
    parentVersionId: parentTimetable?._id || null,
    generationScope: generationScope || { type: 'full' },
    generationReport: generationReport || null,
    generatedAt: new Date(),
  });
};

exports.generateTimetable = async (req, res) => {
  try {
    const { timetableId, scope, academicYearId } = req.body || {};
    const context = await GenerationEngine.loadGenerationContext(academicYearId);
    const validationIssues = validateBeforeGenerate(context.config, context.subjects, context.rooms);
    const blocking = validationIssues.filter((i) => i.severity !== 'warning' && i.type !== 'missing');
    if (blocking.length) {
      return res.status(400).json({ success: false, message: 'Configuration validation failed.', validationIssues: blocking });
    }

    let parentTimetable = null;
    if (timetableId) parentTimetable = await TtGenerated.findById(timetableId);

    const genScope = scope || { type: 'full' };
    const result = await GenerationEngine.generateTimetable({
      scope: genScope,
      academicYearId,
      existingEntries: genScope.type !== 'full' ? parentTimetable?.entries : null,
    });

    const validationSummary = buildValidationSummary(result.conflicts);
    const config = await TtConfig.findById(context.config._id);
    const draft = await persistGeneratedTimetable({
      config,
      entries: result.entries,
      conflicts: result.conflicts,
      validationSummary,
      aiOptimized: result.aiOptimized,
      generationReport: result.generationReport,
      generationScope: genScope,
      parentTimetable,
    });

    res.json({
      success: true,
      draftId: draft._id,
      conflicts: result.conflicts,
      entries: result.entries,
      validationSummary,
      validationIssues,
      aiOptimized: result.aiOptimized,
      generationReport: result.generationReport,
      suggestions: result.suggestions,
      version: draft.version,
      versionGroupId: draft.versionGroupId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.regenerateTimetable = async (req, res) => {
  try {
    const { timetableId, scope, academicYearId } = req.body || {};
    if (!scope?.type) {
      return res.status(400).json({ success: false, message: 'scope.type is required.' });
    }

    let parentTimetable = timetableId
      ? await TtGenerated.findById(timetableId)
      : await TtGenerated.findOne({ isWorkingDraft: true }).sort({ createdAt: -1 });

    const result = await GenerationEngine.generateTimetable({
      scope,
      academicYearId,
      existingEntries: parentTimetable?.entries || null,
    });

    const config = await TtConfig.findOne({ isActive: true });
    if (!config) return res.status(400).json({ success: false, message: 'No active configuration.' });

    const draft = await persistGeneratedTimetable({
      config,
      entries: result.entries,
      conflicts: result.conflicts,
      validationSummary: buildValidationSummary(result.conflicts),
      aiOptimized: result.aiOptimized,
      generationReport: result.generationReport,
      generationScope: scope,
      parentTimetable,
      label: `Regenerated (${scope.type})`,
    });

    res.json({
      success: true,
      draftId: draft._id,
      entries: result.entries,
      conflicts: result.conflicts,
      validationSummary: buildValidationSummary(result.conflicts),
      generationReport: result.generationReport,
      suggestions: result.suggestions,
      version: draft.version,
      scope,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveTimetable = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    const result = await runValidationForTimetable(timetable.entries, timetable.configId);
    const blocking = result.conflicts.filter((c) => c.severity === 'error');
    if (blocking.length) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: ${blocking.length} unresolved error(s).`,
        conflicts: blocking,
      });
    }

    timetable.status = 'approved';
    timetable.isWorkingDraft = false;
    timetable.conflicts = result.conflicts;
    timetable.validationSummary = result.validationSummary;
    await timetable.save();

    res.json({ success: true, timetable, message: 'Timetable approved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listTimetableVersions = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    const groupId = timetable.versionGroupId || timetable._id;
    const versions = await TtGenerated.find({ versionGroupId: groupId })
      .sort({ version: -1 })
      .select('label version status isWorkingDraft aiOptimized validationSummary generationScope generatedAt createdAt parentVersionId');

    res.json({ success: true, versions, currentVersion: timetable.version });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.restoreTimetableVersion = async (req, res) => {
  try {
    const source = await TtGenerated.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Version not found.' });

    const config = await TtConfig.findById(source.configId);
    if (!config) return res.status(400).json({ success: false, message: 'Config not found.' });

    const restored = await persistGeneratedTimetable({
      config,
      entries: source.entries,
      conflicts: source.conflicts,
      validationSummary: source.validationSummary,
      aiOptimized: source.aiOptimized,
      generationReport: { ...(source.generationReport || {}), restoredFrom: source._id },
      generationScope: source.generationScope,
      parentTimetable: source,
      label: `Restored from v${source.version}`,
    });

    res.json({ success: true, timetable: restored, message: `Restored v${source.version} as v${restored.version}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGenerationReport = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    if (timetable.generationReport) {
      return res.json({ success: true, report: timetable.generationReport });
    }

    const context = await GenerationEngine.loadGenerationContext();
    const report = GenerationEngine.buildGenerationReport(
      timetable.entries,
      timetable.conflicts,
      context,
      timetable.generationScope || { type: 'full' },
    );
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyClashResolution = async (req, res) => {
  try {
    const { applyPayload } = req.body || {};
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });
    if (!applyPayload?.type) return res.status(400).json({ success: false, message: 'applyPayload required.' });

    let entries = timetable.entries.map((e) => (e.toObject ? e.toObject() : { ...e }));

    if (applyPayload.type === 'move') {
      entries = GenerationEngine.applyMoveSuggestion(entries, applyPayload);
    } else if (applyPayload.type === 'reassign_room' && applyPayload.entryIndex !== undefined) {
      entries[applyPayload.entryIndex].roomId = applyPayload.roomId;
      entries[applyPayload.entryIndex].roomName = applyPayload.roomName;
    }

    const result = await runValidationForTimetable(entries, timetable.configId);
    timetable.entries = entries;
    timetable.conflicts = result.conflicts;
    timetable.validationSummary = result.validationSummary;
    await timetable.save();

    res.json({ success: true, entries, conflicts: result.conflicts, validationSummary: result.validationSummary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClashResolutions = async (req, res) => {
  try {
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    const context = await GenerationEngine.loadGenerationContext();
    const suggestions = GenerationEngine.buildClashSuggestions(timetable.entries, timetable.conflicts, context);
    res.json({ success: true, suggestions, totalConflicts: timetable.conflicts?.length || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.swapTimetableEntries = async (req, res) => {
  try {
    const { entryIndexA, entryIndexB } = req.body;
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    const entries = timetable.entries.map((e) => (e.toObject ? e.toObject() : { ...e }));
    const a = entries[entryIndexA];
    const b = entries[entryIndexB];
    if (!a || !b) return res.status(400).json({ success: false, message: 'Invalid entry indices.' });

    const swapFields = ['subjectId', 'subjectName', 'subjectType', 'facultyId', 'facultyName', 'roomId', 'roomName', 'roomCapacity', 'isFree'];
    swapFields.forEach((f) => {
      const tmp = a[f];
      a[f] = b[f];
      b[f] = tmp;
    });

    const result = await runValidationForTimetable(entries, timetable.configId);
    timetable.entries = entries;
    timetable.conflicts = result.conflicts;
    timetable.validationSummary = result.validationSummary;
    await timetable.save();

    res.json({ success: true, conflicts: result.conflicts, validationSummary: result.validationSummary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.editTimetableEntry = async (req, res) => {
  try {
    const idx = Number(req.params.entryIndex);
    const timetable = await TtGenerated.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found.' });

    const entries = timetable.entries.map((e) => (e.toObject ? e.toObject() : { ...e }));
    if (!entries[idx]) return res.status(400).json({ success: false, message: 'Invalid entry index.' });

    Object.assign(entries[idx], req.body);
    if (req.body.subjectId || req.body.facultyId) {
      entries[idx].isFree = false;
    }

    const result = await runValidationForTimetable(entries, timetable.configId);
    timetable.entries = entries;
    timetable.conflicts = result.conflicts;
    timetable.validationSummary = result.validationSummary;
    await timetable.save();

    res.json({ success: true, entry: entries[idx], conflicts: result.conflicts, validationSummary: result.validationSummary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cloneSemesterStructure = async (req, res) => {
  try {
    const { sourceBranch, sourceYear, targetBranch, targetYear, prefixCode } = req.body;
    if (!sourceBranch || !sourceYear || !targetBranch || !targetYear) {
      return res.status(400).json({ success: false, message: 'sourceBranch, sourceYear, targetBranch, targetYear required.' });
    }

    const sourceSubjects = await TtSubject.find({ branch: sourceBranch, year: Number(sourceYear), isActive: true }).lean();
    if (!sourceSubjects.length) {
      return res.status(404).json({ success: false, message: 'No source subjects found.' });
    }

    let created = 0;
    for (const sub of sourceSubjects) {
      const newCode = prefixCode ? `${prefixCode}${sub.code}` : `${sub.code}-Y${targetYear}`;
      const exists = await TtSubject.findOne({ code: newCode, branch: targetBranch, year: Number(targetYear) });
      if (exists) continue;
      await TtSubject.create({ ...sub, _id: undefined, code: newCode, branch: targetBranch, year: Number(targetYear) });
      created += 1;
    }

    res.json({ success: true, created, message: `Cloned ${created} subjects.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recommendSlots = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const subject = await TtSubject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

    const context = await GenerationEngine.loadGenerationContext();
    const recommendations = (context.config.timeSlots || [])
      .filter((s) => !s.isBreak)
      .slice(0, 5)
      .map((slot, i) => ({
        day: context.config.workingDays[i % context.config.workingDays.length],
        timeSlot: slot,
        score: 80 - i * 5,
        reasons: ['Available slot', 'Balanced workload'],
      }));

    res.json({ success: true, subject: { name: subject.name, code: subject.code, type: subject.type }, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRoomUtilization = async (req, res) => {
  try {
    const draft = await TtGenerated.findOne({ isWorkingDraft: true }).sort({ createdAt: -1 })
      || await TtGenerated.findOne({ status: 'draft' }).sort({ createdAt: -1 });
    const rooms = await TtRoom.find({ isActive: true }).lean();
    const entries = draft?.entries || [];
    const active = entries.filter((e) => !e.isFree && !e.isLunch);

    const roomStats = rooms.map((r) => {
      const myEntries = active.filter((e) => String(e.roomId) === String(r._id));
      const used = myEntries.length;
      const totalSlots = (draft ? 1 : 0) * 30; // 5 days * 6 slots? Or get from config

      const byDay = {};
      const byType = { theory: 0, lab: 0 };

      myEntries.forEach(e => {
        const day = e.day || 'Unknown';
        byDay[day] = (byDay[day] || 0) + 1;
        if (e.subjectType && e.subjectType.toLowerCase().includes('lab')) {
          byType.lab++;
        } else {
          byType.theory++;
        }
      });

      return {
        roomId: r._id,
        roomName: r.name,
        roomType: r.type,
        capacity: r.capacity,
        usedSlots: used,
        totalSlots: totalSlots || 30,
        utilizationPct: totalSlots ? Math.round((used / totalSlots) * 100) : 0,
        status: used > 20 ? 'high' : used > 5 ? 'medium' : 'low',
        byDay,
        byType
      };
    });

    res.json({
      success: true,
      rooms: roomStats,
      summary: {
        totalRooms: rooms.length,
        avgUtilization: roomStats.length ? Math.round(roomStats.reduce((s, r) => s + r.utilizationPct, 0) / roomStats.length) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFacultyWorkload = async (req, res) => {
  try {
    const draft = await TtGenerated.findOne({ isWorkingDraft: true }).sort({ createdAt: -1 })
      || await TtGenerated.findOne({ status: 'draft' }).sort({ createdAt: -1 });
    const teachers = await Teacher.find({ approvalStatus: 'approved' }).lean();
    const entries = draft?.entries || [];
    const active = entries.filter((e) => !e.isFree && !e.isLunch && e.facultyId);

    let totalLoadPct = 0;
    let overloadedCount = 0;
    let underloadedCount = 0;
    let balancedCount = 0;

    const facultyStats = teachers.map((t) => {
      const mine = active.filter((e) => String(e.facultyId) === String(t._id));
      const weeklyHours = mine.length;
      const maxWeekly = 24;
      const loadPct = Math.round((weeklyHours / maxWeekly) * 100);
      
      const byDay = {};
      const byType = { theory: 0, lab: 0 };
      const overloadedDays = [];
      let gapCount = 0;

      // Group by day for gap calculation and overload detection
      const daySlots = {};

      mine.forEach(e => {
        const day = e.day || 'Unknown';
        byDay[day] = (byDay[day] || 0) + 1;
        
        if (!daySlots[day]) daySlots[day] = [];
        // Extract start time to sort and check for gaps (basic heuristic: just count if they have >1 slot)
        daySlots[day].push(e);

        if (e.subjectType && e.subjectType.toLowerCase().includes('lab')) {
          byType.lab++;
        } else {
          byType.theory++;
        }
      });

      for (const [day, count] of Object.entries(byDay)) {
        if (count >= 4) { // e.g. 4+ slots in a day is overloaded
          overloadedDays.push(day);
        }
        // Basic gap heuristic: if diff between min and max slot index > count, there's a gap
        // (Simplified for now)
      }

      const status = weeklyHours > 20 ? 'overloaded' : weeklyHours < 6 ? 'underloaded' : 'balanced';

      totalLoadPct += loadPct;
      if (status === 'overloaded') overloadedCount++;
      else if (status === 'underloaded') underloadedCount++;
      else balancedCount++;

      return {
        teacherId: t._id,
        teacherName: t.name,
        department: t.department,
        weeklyHours,
        maxWeekly,
        loadPct,
        status,
        byDay,
        byType,
        gapCount,
        overloadedDays
      };
    });

    res.json({ 
      success: true, 
      faculty: facultyStats, 
      summary: { 
        totalFaculty: teachers.length,
        avgLoadPct: teachers.length ? Math.round(totalLoadPct / teachers.length) : 0,
        overloaded: overloadedCount,
        underloaded: underloadedCount,
        balanced: balancedCount
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Phase 7: Heatmap Data ──────────────────────────────────────────────────────
exports.getHeatmapData = async (req, res) => {
  try {
    const published = await TtPublished.findOne({ isActive: true }).sort({ publishedAt: -1 }).lean();
    const draft = published
      ? null
      : (await TtGenerated.findOne({ isWorkingDraft: true }).sort({ createdAt: -1 }).lean()
          || await TtGenerated.findOne({ status: 'draft' }).sort({ createdAt: -1 }).lean());

    const entries = (published?.entries || draft?.entries || []).filter(
      (e) => !e.isFree && !e.isLunch
    );

    // Build day × slot matrix
    const daySlotMap = {};
    const facultyDayMap = {};
    const roomDayMap = {};

    entries.forEach((e) => {
      const day = e.day || 'Unknown';
      const slot = e.timeSlot?.label || e.timeSlot?.startTime || 'Unknown';

      // slot count
      const key = `${day}||${slot}`;
      daySlotMap[key] = (daySlotMap[key] || 0) + 1;

      // faculty load per day
      if (e.facultyId) {
        const fk = `${e.facultyId}||${day}`;
        facultyDayMap[fk] = (facultyDayMap[fk] || 0) + 1;
      }

      // room usage per day
      if (e.roomId) {
        const rk = `${e.roomId}||${day}`;
        roomDayMap[rk] = (roomDayMap[rk] || 0) + 1;
      }
    });

    // Aggregate to arrays
    const slotHeatmap = Object.entries(daySlotMap).map(([key, count]) => {
      const [day, slot] = key.split('||');
      return { day, slot, count };
    });

    // Faculty overload days
    const facultyOverloadDays = {};
    Object.entries(facultyDayMap).forEach(([key, count]) => {
      const [fid, day] = key.split('||');
      if (count >= 4) {
        if (!facultyOverloadDays[day]) facultyOverloadDays[day] = 0;
        facultyOverloadDays[day] += 1;
      }
    });

    // Per-day totals
    const dayTotals = {};
    entries.forEach((e) => {
      const day = e.day || 'Unknown';
      dayTotals[day] = (dayTotals[day] || 0) + 1;
    });

    res.json({
      success: true,
      slotHeatmap,
      dayTotals,
      facultyOverloadDays,
      totalEntries: entries.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


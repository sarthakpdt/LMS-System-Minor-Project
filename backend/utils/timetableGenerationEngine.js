/**
 * Phase 3 — Timetable Generation Orchestrator
 * Wraps existing SchedulingEngine + TimetableOptimizer without modifying services/.
 */
const mongoose = require('mongoose');
const TtConfig = require('../models/TtConfig');
const TtSubject = require('../models/TtSubject');
const TtRoom = require('../models/TtRoom');
const TtFacultyConstraint = require('../models/TtFacultyConstraint');
const TtSection = require('../models/TtSection');
const TtBranch = require('../models/TtBranch');
const TtSemester = require('../models/TtSemester');
const TtAcademicYear = require('../models/TtAcademicYear');
const Student = require('../models/Student');
const SchedulingEngine = require('../services/SchedulingEngine');
const TimetableOptimizer = require('../services/TimetableOptimizer');
const ConflictDetector = require('../services/ConflictDetector');

const MAX_BACKTRACK_ATTEMPTS = 6;

function shuffleArray(arr, seed = 0) {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function entrySlotKey(e) {
  return `${e.branch}::${e.semester}::${e.section}::${e.day}::${e.timeSlot?.startTime}-${e.timeSlot?.endTime}`;
}

function matchesScope(entry, scope) {
  if (!scope || scope.type === 'full' || !scope.type) return true;
  switch (scope.type) {
    case 'branch':
      return entry.branch === scope.branch;
    case 'semester':
      return entry.branch === scope.branch && Number(entry.semester) === Number(scope.semester);
    case 'section':
      return (
        entry.branch === scope.branch &&
        Number(entry.semester) === Number(scope.semester) &&
        entry.section === scope.section
      );
    case 'day':
      return entry.day === scope.day;
    case 'faculty':
      return entry.facultyId && String(entry.facultyId) === String(scope.facultyId);
    default:
      return true;
  }
}

function filterConfigForScope(config, scope) {
  if (!scope || scope.type === 'full' || !scope.type) {
    return JSON.parse(JSON.stringify(config));
  }

  const cloned = JSON.parse(JSON.stringify(config));
  if (scope.type === 'branch' || scope.type === 'semester' || scope.type === 'section') {
    cloned.branches = cloned.branches.filter((b) => b.code === scope.branch);
    if (scope.type === 'semester' || scope.type === 'section') {
      cloned.branches = cloned.branches.map((b) => ({
        ...b,
        semesters: b.semesters.filter((s) => s.semesterNumber === Number(scope.semester)),
      }));
    }
    if (scope.type === 'section') {
      cloned.branches = cloned.branches.map((b) => ({
        ...b,
        semesters: b.semesters.map((s) => ({
          ...s,
          sections: s.sections.filter((sec) => sec === scope.section),
        })),
      }));
    }
  }
  return cloned;
}

function filterSubjectsForScope(subjects, scope) {
  if (!scope || scope.type === 'full' || !scope.type) return subjects;
  if (scope.type === 'branch') {
    return subjects.filter((s) => s.branch === scope.branch);
  }
  if (scope.type === 'semester' || scope.type === 'section') {
    return subjects.filter((s) => s.branch === scope.branch && Number(s.semester) === Number(scope.semester));
  }
  if (scope.type === 'faculty') {
    return subjects.filter((s) => s.facultyId && String(s.facultyId) === String(scope.facultyId));
  }
  return subjects;
}

async function loadStudentCounts(config) {
  const counts = { ...(config.studentCounts || {}) };

  const sections = await TtSection.find({ isActive: true })
    .populate({ path: 'branchId', select: 'code' })
    .populate({ path: 'semesterId', select: 'semesterNumber' })
    .lean();

  for (const sec of sections) {
    const branchCode = sec.branchId?.code?.toUpperCase();
    const semester = sec.semesterId?.semesterNumber;
    if (!branchCode || !semester) continue;
    const key = `${branchCode}::${semester}::${sec.label}`;
    counts[key] = sec.studentCount || 0;
  }

  const studentsList = await Student.find(
    { approvalStatus: 'approved', isActive: { $ne: false } },
    'department semester section timetableBranch',
  ).lean();

  studentsList.forEach((s) => {
    const branch = s.timetableBranch || s.department;
    const sem = Number(s.semester);
    const key = `${branch}::${sem}::${s.section || 'A'}`;
    counts[key] = (counts[key] || 60) + 1;
  });

  return counts;
}

async function loadGenerationContext(academicYearId) {
  let config = await TtConfig.findOne({ isActive: true }).lean();
  if (!config) {
    throw new Error('No active timetable configuration found. Complete Phase 2 setup and sync config first.');
  }

  if (academicYearId) {
    const ay = await TtAcademicYear.findOne({ _id: academicYearId, isActive: true }).lean();
    if (ay) {
      const synced = await TtConfig.findOne({ academicYear: ay.label, isActive: true }).lean();
      if (synced) config = synced;
    }
  }

  config.studentCounts = await loadStudentCounts(config);

  const [subjects, rooms, facultyConstraints] = await Promise.all([
    TtSubject.find({ isActive: true }).lean(),
    TtRoom.find({ isActive: true }).lean(),
    TtFacultyConstraint.find().lean(),
  ]);

  return { config, subjects, rooms, facultyConstraints };
}

function scoreConflicts(conflicts) {
  let errors = 0;
  let warnings = 0;
  (conflicts || []).forEach((c) => {
    if (c.severity === 'error') errors += 1;
    else warnings += 1;
  });
  return errors * 1000 + warnings;
}

function runSinglePass(config, subjects, rooms, facultyConstraints, attemptSeed = 0) {
  const theory = subjects.filter((s) => s.type === 'theory');
  const labs = subjects.filter((s) => s.type === 'lab');
  const shuffledTheory = shuffleArray(theory, attemptSeed);
  const shuffledLabs = shuffleArray(labs, attemptSeed + 7);
  const orderedSubjects = [...shuffledLabs, ...shuffledTheory];

  const engineResult = SchedulingEngine.generate(config, orderedSubjects, rooms, facultyConstraints);
  const optimized = TimetableOptimizer.optimize(
    engineResult.entries,
    orderedSubjects,
    facultyConstraints,
    config,
  );

  return {
    entries: optimized.entries,
    conflicts: optimized.conflicts,
    aiOptimized: optimized.optimized,
    score: scoreConflicts(optimized.conflicts),
  };
}

function runWithBacktracking(config, subjects, rooms, facultyConstraints) {
  let best = null;

  for (let attempt = 0; attempt < MAX_BACKTRACK_ATTEMPTS; attempt += 1) {
    const result = runSinglePass(config, subjects, rooms, facultyConstraints, attempt);
    if (!best || result.score < best.score) {
      best = result;
    }
    if (result.score === 0) break;
  }

  return best;
}

function resetScopedEntries(entries, scope) {
  return entries.map((e) => {
    if (!matchesScope(e, scope)) return { ...e };
    if (e.isLunch) return { ...e };
    return {
      ...e,
      subjectId: null,
      subjectName: 'Free Slot',
      subjectType: 'free',
      facultyId: null,
      facultyName: '',
      roomId: null,
      roomName: '',
      roomCapacity: null,
      isFree: true,
    };
  });
}

function mergeScopedResults(baseEntries, newEntries, scope) {
  const newMap = new Map();
  newEntries.forEach((e) => newMap.set(entrySlotKey(e), e));

  return baseEntries.map((e) => {
    if (!matchesScope(e, scope)) return e;
    const replacement = newMap.get(entrySlotKey(e));
    return replacement || e;
  });
}

function filterEntriesByScope(entries, scope) {
  if (!scope || scope.type === 'full') return entries;
  if (scope.type === 'day') {
    return entries.filter((e) => e.day === scope.day);
  }
  return entries.filter((e) => matchesScope(e, scope));
}

function buildGenerationReport(entries, conflicts, context, scope, meta = {}) {
  const active = entries.filter((e) => !e.isFree && !e.isLunch);
  const errors = (conflicts || []).filter((c) => c.severity === 'error');
  const warnings = (conflicts || []).filter((c) => c.severity === 'warning');

  const byBranch = {};
  const byType = { theory: 0, lab: 0 };
  active.forEach((e) => {
    byBranch[e.branch] = (byBranch[e.branch] || 0) + 1;
    if (e.subjectType === 'lab') byType.lab += 1;
    else if (e.subjectType === 'theory') byType.theory += 1;
  });

  const facultyLoads = {};
  active.forEach((e) => {
    if (!e.facultyId) return;
    const id = String(e.facultyId);
    facultyLoads[id] = facultyLoads[id] || { name: e.facultyName, count: 0 };
    facultyLoads[id].count += 1;
  });

  const roomUsage = {};
  active.forEach((e) => {
    if (!e.roomId) return;
    const id = String(e.roomId);
    roomUsage[id] = roomUsage[id] || { name: e.roomName, count: 0 };
    roomUsage[id].count += 1;
  });

  const missingSubjects = (conflicts || [])
    .filter((c) => c.type === 'missing' || c.type === 'unassigned')
    .map((c) => c.description);

  return {
    generatedAt: new Date().toISOString(),
    scope: scope || { type: 'full' },
    algorithm: 'constraint-scheduling + backtracking + greedy optimization',
    attempts: meta.attempts || 1,
    aiOptimized: Boolean(meta.aiOptimized),
    stats: {
      totalSlots: entries.length,
      scheduledLectures: active.length,
      freeSlots: entries.filter((e) => e.isFree).length,
      lunchSlots: entries.filter((e) => e.isLunch).length,
      errorCount: errors.length,
      warningCount: warnings.length,
      branches: Object.keys(byBranch).length,
      lecturesByBranch: byBranch,
      lecturesByType: byType,
      facultyScheduled: Object.keys(facultyLoads).length,
      roomsUsed: Object.keys(roomUsage).length,
    },
    facultyLoads: Object.values(facultyLoads).sort((a, b) => b.count - a.count).slice(0, 20),
    roomUsage: Object.values(roomUsage).sort((a, b) => b.count - a.count).slice(0, 20),
    missingSubjects,
    topErrors: errors.slice(0, 10).map((c) => c.description),
    topWarnings: warnings.slice(0, 10).map((c) => c.description),
    configSnapshot: {
      academicYear: context.config.academicYear,
      workingDays: context.config.workingDays?.length || 0,
      timeSlots: context.config.timeSlots?.length || 0,
      subjectCount: context.subjects.length,
      roomCount: context.rooms.length,
      schedulingRules: context.config.schedulingRules || null,
    },
  };
}

function buildClashSuggestions(entries, conflicts, context) {
  const { config } = context;
  const workingDays = config.workingDays || [];
  const timeSlots = config.timeSlots || [];
  const suggestions = [];

  for (const conflict of conflicts || []) {
    if (conflict.type === 'teacher') {
      const nameMatch = conflict.description.match(/^Teacher conflict:\s*(.+?)\s+is double-booked/);
      const facultyName = nameMatch ? nameMatch[1] : null;
      const doubleBooked = entries.filter(
        (e) => e.facultyName === facultyName && !e.isFree && !e.isLunch,
      );

      const altSlots = [];
      for (const entry of doubleBooked.slice(0, 2)) {
        for (const day of workingDays) {
          for (const slot of timeSlots) {
            if (slot.isBreak) continue;
            const facultyBusy = entries.some(
              (e) =>
                e.facultyName === facultyName &&
                e.day === day &&
                e.timeSlot.startTime === slot.startTime &&
                !e.isFree &&
                !e.isLunch,
            );
            const sectionBusy = entries.some(
              (e) =>
                e.branch === entry.branch &&
                e.semester === entry.semester &&
                e.section === entry.section &&
                e.day === day &&
                e.timeSlot.startTime === slot.startTime &&
                !e.isFree &&
                !e.isLunch,
            );
            if (!facultyBusy && !sectionBusy) {
              altSlots.push({
                day,
                slotLabel: slot.label,
                startTime: slot.startTime,
                endTime: slot.endTime,
                entryIndex: entries.findIndex((e) => entrySlotKey(e) === entrySlotKey(entry)),
                subjectName: entry.subjectName,
                section: entry.section,
              });
            }
          }
        }
      }

      const best = altSlots[0];
      suggestions.push({
        conflictDescription: conflict.description,
        conflictType: conflict.type,
        severity: conflict.severity,
        recommendation: best
          ? `Move "${best.subjectName}" (Section ${best.section}) to ${best.day} at ${best.slotLabel}.`
          : `No free slot found for ${facultyName}. Try regenerating that faculty's schedule.`,
        actionType: best ? 'move' : 'regenerate',
        applyPayload: best
          ? {
              type: 'move',
              entryIndex: best.entryIndex,
              targetDay: best.day,
              targetStartTime: best.startTime,
              targetEndTime: best.endTime,
              targetLabel: best.slotLabel,
            }
          : null,
        alternativeSlots: altSlots.slice(0, 5),
      });
    } else if (conflict.type === 'room') {
      const freeRooms = context.rooms.filter((r) => r.isActive !== false).slice(0, 5);
      suggestions.push({
        conflictDescription: conflict.description,
        conflictType: conflict.type,
        severity: conflict.severity,
        recommendation: freeRooms.length
          ? `Reassign to available room: ${freeRooms.map((r) => r.name).join(', ')}`
          : 'Add more rooms in configuration.',
        actionType: 'reassign_room',
        applyPayload: freeRooms[0]
          ? { type: 'reassign_room', roomId: freeRooms[0]._id, roomName: freeRooms[0].name }
          : null,
        alternativeRooms: freeRooms.map((r) => ({
          id: r._id,
          name: r.name,
          capacity: r.capacity,
          type: r.type,
        })),
      });
    } else {
      suggestions.push({
        conflictDescription: conflict.description,
        conflictType: conflict.type,
        severity: conflict.severity,
        recommendation: 'Review configuration or regenerate affected scope.',
        actionType: conflict.type === 'missing' ? 'regenerate' : 'review',
        applyPayload: null,
      });
    }
  }

  return suggestions;
}

function applyMoveSuggestion(entries, payload) {
  const grid = entries.map((e) => ({ ...e }));
  const { entryIndex, targetDay, targetStartTime, targetEndTime, targetLabel } = payload;
  if (entryIndex < 0 || entryIndex >= grid.length) return grid;

  const source = grid[entryIndex];
  const targetIdx = grid.findIndex(
    (e) =>
      e.branch === source.branch &&
      e.semester === source.semester &&
      e.section === source.section &&
      e.day === targetDay &&
      e.timeSlot.startTime === targetStartTime &&
      e.isFree,
  );

  if (targetIdx === -1) return grid;

  const moved = { ...source, day: targetDay, timeSlot: { label: targetLabel, startTime: targetStartTime, endTime: targetEndTime } };
  grid[targetIdx] = moved;
  grid[entryIndex] = {
    ...source,
    subjectId: null,
    subjectName: 'Free Slot',
    subjectType: 'free',
    facultyId: null,
    facultyName: '',
    roomId: null,
    roomName: '',
    isFree: true,
  };
  return grid;
}

async function generateTimetable(options = {}) {
  const {
    scope = { type: 'full' },
    academicYearId,
    existingEntries = null,
    parentVersionId = null,
  } = options;

  const context = await loadGenerationContext(academicYearId);
  const scopedConfig = filterConfigForScope(context.config, scope);
  const scopedSubjects = filterSubjectsForScope(context.subjects, scope);

  if (!scopedConfig.branches?.length && scope.type !== 'full') {
    throw new Error('Scope filter produced empty branch configuration.');
  }

  let result;
  if (existingEntries && scope.type !== 'full') {
    const cleared = resetScopedEntries(existingEntries, scope);
    const partial = runWithBacktracking(
      scopedConfig,
      scopedSubjects,
      context.rooms,
      context.facultyConstraints,
    );
    const merged = mergeScopedResults(cleared, partial.entries, scope);
    const conflicts = ConflictDetector.validate(
      merged,
      context.subjects,
      context.facultyConstraints,
      context.config,
    );
    result = {
      entries: merged,
      conflicts,
      aiOptimized: partial.aiOptimized,
      score: scoreConflicts(conflicts),
    };
  } else {
    result = runWithBacktracking(
      scopedConfig,
      scopedSubjects,
      context.rooms,
      context.facultyConstraints,
    );
  }

  const report = buildGenerationReport(result.entries, result.conflicts, context, scope, {
    attempts: MAX_BACKTRACK_ATTEMPTS,
    aiOptimized: result.aiOptimized,
  });

  const suggestions = buildClashSuggestions(result.entries, result.conflicts, context);

  return {
    entries: result.entries,
    conflicts: result.conflicts,
    aiOptimized: result.aiOptimized,
    generationReport: report,
    suggestions,
    context,
    scope,
    parentVersionId,
  };
}

module.exports = {
  loadGenerationContext,
  generateTimetable,
  buildGenerationReport,
  buildClashSuggestions,
  applyMoveSuggestion,
  matchesScope,
  filterEntriesByScope,
  scoreConflicts,
};

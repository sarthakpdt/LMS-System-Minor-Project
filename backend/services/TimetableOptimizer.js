const ConflictDetector = require('./ConflictDetector');

/**
 * Post-constraint optimization: balances faculty workload and free-slot distribution
 * without violating hard constraints detected by ConflictDetector.
 */
class TimetableOptimizer {
  static optimize(entries, subjects, facultyConstraints, config) {
    const grid = entries.map((e) => ({ ...e }));
    const subjectMap = new Map();
    (subjects || []).forEach((s) => subjectMap.set(String(s._id), s));

    const maxIterations = 200;
    let improved = true;
    let iteration = 0;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration += 1;

      const facultyDaily = this._facultyDailyHours(grid);
      const theoryEntries = grid.filter(
        (e) => e.subjectType === 'theory' && !e.isFree && !e.isLunch
      );

      for (const entry of theoryEntries) {
        const facultyId = entry.facultyId ? String(entry.facultyId) : null;
        if (!facultyId) continue;

        const dayHours = facultyDaily.get(facultyId) || {};
        const currentDayLoad = dayHours[entry.day] || 0;
        const maxDaily = this._maxDailyFor(facultyId, facultyConstraints);

        const overloaded = currentDayLoad > Math.ceil(maxDaily / 2);
        if (!overloaded && !this._hasPreferredMismatch(entry, subjectMap)) continue;

        const swapTarget = this._findBetterSlot(
          grid,
          entry,
          subjectMap,
          facultyDaily,
          facultyConstraints,
          config
        );

        if (swapTarget) {
          this._swapEntries(grid, entry, swapTarget);
          this._rebuildFacultyDaily(facultyDaily, grid);

          const conflicts = ConflictDetector.validate(
            grid,
            subjects,
            facultyConstraints,
            config
          );
          const hasErrors = conflicts.some((c) => c.severity === 'error');
          if (hasErrors) {
            this._swapEntries(grid, entry, swapTarget);
            this._rebuildFacultyDaily(facultyDaily, grid);
          } else {
            improved = true;
          }
        }
      }
    }

    const finalConflicts = ConflictDetector.validate(
      grid,
      subjects,
      facultyConstraints,
      config
    );

    return {
      entries: grid,
      conflicts: finalConflicts,
      optimized: iteration > 1,
    };
  }

  static _facultyDailyHours(grid) {
    const map = new Map();
    grid.forEach((e) => {
      if (e.isFree || e.isLunch || !e.facultyId) return;
      const fid = String(e.facultyId);
      if (!map.has(fid)) map.set(fid, {});
      const dayMap = map.get(fid);
      dayMap[e.day] = (dayMap[e.day] || 0) + 1;
    });
    return map;
  }

  static _rebuildFacultyDaily(map, grid) {
    map.clear();
    grid.forEach((e) => {
      if (e.isFree || e.isLunch || !e.facultyId) return;
      const fid = String(e.facultyId);
      if (!map.has(fid)) map.set(fid, {});
      const dayMap = map.get(fid);
      dayMap[e.day] = (dayMap[e.day] || 0) + 1;
    });
  }

  static _maxDailyFor(facultyId, facultyConstraints) {
    const c = (facultyConstraints || []).find(
      (fc) => String(fc.facultyId) === facultyId
    );
    return c?.maxHoursPerDay || 6;
  }

  static _hasPreferredMismatch(entry, subjectMap) {
    if (!entry.subjectId) return false;
    const sub = subjectMap.get(String(entry.subjectId));
    if (!sub?.preferredDays?.length) return false;
    return !sub.preferredDays.includes(entry.day);
  }

  static _slotKey(e) {
    return `${e.day}::${e.timeSlot.startTime}-${e.timeSlot.endTime}`;
  }

  static _isFacultyUnavailable(facultyId, day, startTime, endTime, facultyConstraints) {
    const c = (facultyConstraints || []).find(
      (fc) => String(fc.facultyId) === String(facultyId)
    );
    if (!c?.unavailableSlots?.length) return false;
    return c.unavailableSlots.some(
      (u) =>
        u.day === day &&
        u.startTime < endTime &&
        u.endTime > startTime
    );
  }

  static _findBetterSlot(grid, entry, subjectMap, facultyDaily, facultyConstraints, config) {
    const facultyId = String(entry.facultyId);
    const dayHours = facultyDaily.get(facultyId) || {};
    const sub = entry.subjectId ? subjectMap.get(String(entry.subjectId)) : null;
    const preferredDays = sub?.preferredDays || [];
    const preferredSlots = (sub?.preferredSlots || []).map((s) => s.toLowerCase());

    const candidates = grid.filter(
      (e) =>
        e.isFree &&
        !e.isLunch &&
        e.branch === entry.branch &&
        e.year === entry.year &&
        e.section === entry.section &&
        e.day !== entry.day
    );

    candidates.sort((a, b) => {
      const loadA = dayHours[a.day] || 0;
      const loadB = dayHours[b.day] || 0;
      const prefA = preferredDays.includes(a.day) ? -10 : 0;
      const prefB = preferredDays.includes(b.day) ? -10 : 0;
      const slotPrefA = preferredSlots.some((p) =>
        a.timeSlot.label.toLowerCase().includes(p)
      )
        ? -5
        : 0;
      const slotPrefB = preferredSlots.some((p) =>
        b.timeSlot.label.toLowerCase().includes(p)
      )
        ? -5
        : 0;
      return loadA + prefA + slotPrefA - (loadB + prefB + slotPrefB);
    });

    for (const candidate of candidates) {
      if (
        this._isFacultyUnavailable(
          facultyId,
          candidate.day,
          candidate.timeSlot.startTime,
          candidate.timeSlot.endTime,
          facultyConstraints
        )
      ) {
        continue;
      }

      const roomConflict = grid.some(
        (e) =>
          !e.isFree &&
          !e.isLunch &&
          e.roomId &&
          String(e.roomId) === String(entry.roomId) &&
          e.day === candidate.day &&
          this._slotKey(e) === this._slotKey(candidate)
      );
      if (roomConflict) continue;

      const facultyConflict = grid.some(
        (e) =>
          !e.isFree &&
          !e.isLunch &&
          e.facultyId &&
          String(e.facultyId) === facultyId &&
          e.day === candidate.day &&
          this._slotKey(e) === this._slotKey(candidate)
      );
      if (facultyConflict) continue;

      return candidate;
    }

    return null;
  }

  static _swapEntries(grid, a, b) {
    const fields = [
      'subjectId',
      'subjectName',
      'subjectType',
      'facultyId',
      'facultyName',
      'roomId',
      'roomName',
      'isFree',
    ];

    const temp = {};
    fields.forEach((f) => {
      temp[f] = a[f];
      a[f] = b[f];
      b[f] = temp[f];
    });
  }
}

module.exports = TimetableOptimizer;

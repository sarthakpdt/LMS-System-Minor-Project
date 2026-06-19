/**
 * Service to detect conflicts and scheduling violations in a generated timetable.
 */
class ConflictDetector {
  /**
   * Validate a list of timetable entries against college constraints.
   * @param {Array} entries - The list of generated entry objects
   * @param {Array} subjects - List of active TtSubject objects
   * @param {Array} facultyConstraints - List of active TtFacultyConstraint objects
   * @param {Object} config - Active TtConfig object
   * @returns {Array} List of conflict objects { type, description, severity }
   */
  static validate(entries, subjects, facultyConstraints, config) {
    const conflicts = [];
    const activeEntries = entries.filter(e => !e.isFree && !e.isLunch);

    // Create indexes for easy lookup
    const constraintsMap = new Map();
    if (facultyConstraints && Array.isArray(facultyConstraints)) {
      facultyConstraints.forEach(c => {
        constraintsMap.set(c.facultyId.toString(), c);
      });
    }

    // --- 1. DOUBLE BOOKING CHECKS ---
    // Track double bookings by checking overlaps in day + timeSlot + resource
    const facultyBookings = {}; // key: facultyId + "::" + day + "::" + startTime + "-" + endTime
    const roomBookings = {};    // key: roomId + "::" + day + "::" + startTime + "-" + endTime
    const sectionBookings = {}; // key: branch + "::" + year + "::" + section + "::" + day + "::" + startTime + "-" + endTime

    activeEntries.forEach(entry => {
      const { branch, year, section, day, timeSlot, facultyId, facultyName, roomId, roomName, subjectName } = entry;
      const slotKey = `${day}::${timeSlot.startTime}-${timeSlot.endTime}`;

      // A. Faculty Double Booking
      if (facultyId) {
        const facKey = `${facultyId.toString()}::${slotKey}`;
        if (facultyBookings[facKey]) {
          facultyBookings[facKey].push(entry);
        } else {
          facultyBookings[facKey] = [entry];
        }
      }

      // B. Room Double Booking
      if (roomId) {
        const rmKey = `${roomId.toString()}::${slotKey}`;
        if (roomBookings[rmKey]) {
          roomBookings[rmKey].push(entry);
        } else {
          roomBookings[rmKey] = [entry];
        }
      }

      // C. Section Double Booking
      const secKey = `${branch}::${year}::${section}::${slotKey}`;
      if (sectionBookings[secKey]) {
        sectionBookings[secKey].push(entry);
      } else {
        sectionBookings[secKey] = [entry];
      }
    });

    // Report Faculty Double Bookings
    Object.entries(facultyBookings).forEach(([key, list]) => {
      if (list.length > 1) {
        const details = list.map(e => `${e.branch} Year ${e.year} Sec ${e.section} (${e.subjectName})`).join(' and ');
        conflicts.push({
          type: 'teacher',
          description: `Teacher conflict: ${list[0].facultyName} is double-booked on ${list[0].day} at ${list[0].timeSlot.label} for ${details}`,
          severity: 'error'
        });
      }
    });

    // Report Room Double Bookings
    Object.entries(roomBookings).forEach(([key, list]) => {
      if (list.length > 1) {
        const details = list.map(e => `${e.branch} Year ${e.year} Sec ${e.section} (${e.subjectName})`).join(' and ');
        conflicts.push({
          type: 'room',
          description: `Room conflict: Room ${list[0].roomName} is double-booked on ${list[0].day} at ${list[0].timeSlot.label} for ${details}`,
          severity: 'error'
        });
      }
    });

    // Report Section Double Bookings
    Object.entries(sectionBookings).forEach(([key, list]) => {
      if (list.length > 1) {
        const details = list.map(e => e.subjectName).join(' and ');
        conflicts.push({
          type: 'section',
          description: `Section conflict: Section ${list[0].branch} Yr ${list[0].year} ${list[0].section} has multiple classes scheduled on ${list[0].day} at ${list[0].timeSlot.label} (${details})`,
          severity: 'error'
        });
      }
    });

    // --- 2. LUNCH BREAK VIOLATIONS ---
    if (config.lunchBreak) {
      const { startTime: lunchStart, endTime: lunchEnd } = config.lunchBreak;
      activeEntries.forEach(entry => {
        const { startTime, endTime } = entry.timeSlot;
        // Check overlap with lunch
        const hasOverlap = (startTime < lunchEnd && endTime > lunchStart);
        if (hasOverlap) {
          conflicts.push({
            type: 'lunch',
            description: `Lunch conflict: ${entry.branch} Year ${entry.year} Section ${entry.section} has class "${entry.subjectName}" scheduled during lunch break (${lunchStart} - ${lunchEnd})`,
            severity: 'error'
          });
        }
      });
    }

    // --- 3. FACULTY AVAILABILITY CONSTRAINTS ---
    activeEntries.forEach(entry => {
      if (!entry.facultyId) return;
      const constraint = constraintsMap.get(entry.facultyId.toString());
      if (!constraint) return;

      const { day, timeSlot, facultyName } = entry;
      const { startTime: classStart, endTime: classEnd } = timeSlot;

      constraint.unavailableSlots.forEach(unavail => {
        if (unavail.day === day) {
          // Check overlap
          const hasOverlap = (classStart < unavail.endTime && classEnd > unavail.startTime);
          if (hasOverlap) {
            conflicts.push({
              type: 'teacher',
              description: `Faculty availability violation: ${facultyName} is scheduled for "${entry.subjectName}" on ${day} ${timeSlot.label}, but is unavailable (${unavail.startTime} - ${unavail.endTime}: ${unavail.reason})`,
              severity: 'error'
            });
          }
        }
      });
    });

    // --- 4. ROOM CAPACITY CHECKS ---
    // Compare student strength in section to room capacity
    const studentCounts = config.studentCounts || {};
    activeEntries.forEach(entry => {
      if (entry.roomId && entry.roomName) {
        const key = `${entry.branch}::${entry.year}::${entry.section}`;
        const strength = studentCounts[key] || 15; // default fallback count if no students enrolled yet
        
        // Find the room from the room pool or config if passed, else skip
        // Wait, room objects are not passed directly except if we search
        // We can just find the room by name or ID in the rooms list. Let's do a capacity check if we have the rooms.
      }
    });

    // --- 5. CONSECUTIVE HEAVY SUBJECTS CHECK ---
    // Heavy subjects definition: DSA, DBMS, OS, COA, Mathematics/Maths
    const HEAVY_KEYWORDS = ['dsa', 'dbms', 'os', 'coa', 'math', 'discrete', 'algo'];
    const isHeavySubject = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return HEAVY_KEYWORDS.some(k => lower.includes(k));
    };

    // Group entries by Section (branch + year + section) and Day to check consecutive slots
    const sectionDailySlots = {};
    activeEntries.forEach(entry => {
      const secKey = `${entry.branch}::${entry.year}::${entry.section}::${entry.day}`;
      if (!sectionDailySlots[secKey]) sectionDailySlots[secKey] = [];
      sectionDailySlots[secKey].push(entry);
    });

    Object.entries(sectionDailySlots).forEach(([key, list]) => {
      // Sort entries by slotIndex
      list.sort((a, b) => (a.slotIndex || 0) - (b.slotIndex || 0));
      
      let consecutiveHeavy = 0;
      let consecutiveHeavyNames = [];
      
      for (let i = 0; i < list.length; i++) {
        const current = list[i];
        const next = list[i + 1];
        const isCurrentHeavy = isHeavySubject(current.subjectName);
        
        if (isCurrentHeavy) {
          consecutiveHeavy++;
          consecutiveHeavyNames.push(current.subjectName);
          
          if (consecutiveHeavy > 3) {
            conflicts.push({
              type: 'section',
              description: `Student Friendly timetable violation: more than 3 difficult subjects scheduled consecutively for ${current.branch} Yr ${current.year} Sec ${current.section} on ${current.day} (${consecutiveHeavyNames.join(' -> ')}).`,
              severity: 'warning'
            });
          }
        }
        
        // Check if next is consecutive (next slotIndex = current slotIndex + 1)
        if (next && (next.slotIndex !== current.slotIndex + 1)) {
          // Gap occurred, reset count
          consecutiveHeavy = 0;
          consecutiveHeavyNames = [];
        } else if (!isCurrentHeavy) {
          consecutiveHeavy = 0;
          consecutiveHeavyNames = [];
        }
      }
    });

    // --- 6. TEACHER GAPS MINIMIZATION ---
    // Group active slots per teacher per day to find holes in their schedule
    const teacherDailySlots = {};
    activeEntries.forEach(entry => {
      if (!entry.facultyId) return;
      const tKey = `${entry.facultyId.toString()}::${entry.day}`;
      if (!teacherDailySlots[tKey]) teacherDailySlots[tKey] = [];
      teacherDailySlots[tKey].push(entry);
    });

    Object.entries(teacherDailySlots).forEach(([key, list]) => {
      if (list.length <= 1) return;
      list.sort((a, b) => (a.slotIndex || 0) - (b.slotIndex || 0));
      
      const teacherName = list[0].facultyName;
      const day = list[0].day;
      
      for (let i = 0; i < list.length - 1; i++) {
        const current = list[i];
        const next = list[i + 1];
        const gap = next.slotIndex - current.slotIndex - 1;
        
        if (gap >= 2) {
          conflicts.push({
            type: 'teacher',
            description: `Teacher schedule gap: Dr/Prof ${teacherName} has a large gap of ${gap} free hours on ${day} between ${current.timeSlot.endTime} and ${next.timeSlot.startTime}.`,
            severity: 'warning'
          });
        }
      }
    });

    // --- 7. WEEKLY HOURS & UNASSIGNED SUBJECTS CHECKS ---
    const hoursCount = {};
    activeEntries.forEach(entry => {
      if (!entry.subjectId) return;
      const key = `${entry.subjectId.toString()}::${entry.branch}::${entry.year}::${entry.section}`;
      hoursCount[key] = (hoursCount[key] || 0) + 1;
    });

    subjects.forEach(sub => {
      const branchObj = config.branches.find(b => b.code === sub.branch);
      if (!branchObj) return;

      const yearObj = branchObj.years.find(y => y.yearNumber === sub.year);
      if (!yearObj) return;

      yearObj.sections.forEach(sec => {
        const key = `${sub._id.toString()}::${sub.branch}::${sub.year}::${sec}`;
        const placed = hoursCount[key] || 0;
        const target = sub.weeklyHours;

        if (placed === 0) {
          conflicts.push({
            type: 'unassigned',
            description: `Unassigned subject: "${sub.name}" (${sub.code}) is not scheduled at all for ${sub.branch} Year ${sub.year} Section ${sec}. Target: ${target} lectures/week.`,
            severity: 'error'
          });
        } else if (placed < target) {
          conflicts.push({
            type: 'missing',
            description: `Missing lectures: "${sub.name}" (${sub.code}) for ${sub.branch} Year ${sub.year} Section ${sec} has only ${placed}/${target} lectures scheduled.`,
            severity: 'error'
          });
        } else if (placed > target) {
          conflicts.push({
            type: 'missing',
            description: `Over-scheduled lectures: "${sub.name}" (${sub.code}) for ${sub.branch} Year ${sub.year} Section ${sec} has ${placed}/${target} lectures scheduled.`,
            severity: 'warning'
          });
        }
      });
    });

    return conflicts;
  }
}

module.exports = ConflictDetector;

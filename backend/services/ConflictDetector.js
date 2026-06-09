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
            type: 'lab', // Or general conflict type
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

    // --- 4. WEEKLY HOURS & UNASSIGNED SUBJECTS CHECKS ---
    // Count placed hours for each subject per section
    // key: subjectId + "::" + branch + "::" + year + "::" + section
    const hoursCount = {};
    activeEntries.forEach(entry => {
      if (!entry.subjectId) return;
      const key = `${entry.subjectId.toString()}::${entry.branch}::${entry.year}::${entry.section}`;
      // Each lecture slot represents 1 instance. If it's a lab, we calculate duration or just increment based on slots.
      // Usually, in a timetable, each slot is a single time slot item.
      // Let's increment by 1 slot. We'll match it to target weeklyHours slots or hours.
      // Wait, is weeklyHours in terms of slots or literal hours?
      // "DBMS -> 4 lectures/week", "OS -> 3 lectures/week", "DSA -> 5 lectures/week"
      // So weeklyHours is target lectures (i.e. slots) per week!
      hoursCount[key] = (hoursCount[key] || 0) + 1;
    });

    subjects.forEach(sub => {
      // Find all sections that should attend this subject.
      // In a real college, a subject belongs to a branch + year. All sections of this branch/year attend it.
      // Let's find sections from config
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

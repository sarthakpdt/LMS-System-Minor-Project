const ConflictDetector = require('./ConflictDetector');

class SchedulingEngine {
  /**
   * Generates a conflict-free timetable draft.
   * @param {Object} config - Active TtConfig
   * @param {Array} subjects - List of all TtSubjects
   * @param {Array} rooms - List of all TtRooms
   * @param {Array} facultyConstraints - List of TtFacultyConstraints
   * @returns {Object} { entries: Array, conflicts: Array }
   */
  static generate(config, subjects, rooms, facultyConstraints) {
    const entries = [];
    const workingDays = config.workingDays; // e.g. ["Monday", "Tuesday", ...]
    const timeSlots = config.timeSlots; // e.g. [{ label, startTime, endTime, isBreak, breakType }]
    const lectureDuration = config.lectureDuration || 50;

    // Build map of faculty constraints
    const constraintsMap = new Map();
    if (facultyConstraints) {
      facultyConstraints.forEach(c => {
        constraintsMap.set(c.facultyId.toString(), {
          unavailable: c.unavailableSlots || [],
          maxDaily: c.maxHoursPerDay || 6,
          maxWeekly: c.maxHoursPerWeek || 24,
          dailyHours: {}, // day -> count
          weeklyHours: 0
        });
      });
    }

    // Step 1: Initialize Grid
    // For each branch, year, section, day, and time slot, create an entry slot.
    const grid = [];

    config.branches.forEach(branch => {
      branch.years.forEach(year => {
        year.sections.forEach(section => {
          workingDays.forEach(day => {
            timeSlots.forEach((slot, slotIndex) => {
              const isLunch = slot.isBreak && slot.breakType === 'lunch';
              
              const entry = {
                branch: branch.code,
                year: year.yearNumber,
                section: section,
                day: day,
                timeSlot: {
                  label: slot.label,
                  startTime: slot.startTime,
                  endTime: slot.endTime
                },
                slotIndex: slotIndex,
                subjectId: null,
                subjectName: isLunch ? 'Lunch Break' : 'Free Slot',
                subjectType: isLunch ? 'lunch' : 'free',
                facultyId: null,
                facultyName: '',
                roomId: null,
                roomName: '',
                isLunch: isLunch,
                isFree: !isLunch
              };

              grid.push(entry);
            });
          });
        });
      });
    });

    // Helper functions to check if resources are free
    const isFacultyFree = (facultyId, day, startTime, endTime) => {
      if (!facultyId) return true;
      
      // Check if scheduled in any grid slot at this time
      const busy = grid.some(e => 
        e.facultyId && 
        e.facultyId.toString() === facultyId.toString() &&
        e.day === day &&
        e.timeSlot.startTime < endTime &&
        e.timeSlot.endTime > startTime
      );
      if (busy) return false;

      // Check faculty constraints
      const fc = constraintsMap.get(facultyId.toString());
      if (fc) {
        // Daily/weekly limit check
        const currentDaily = fc.dailyHours[day] || 0;
        if (currentDaily >= fc.maxDaily) return false;
        if (fc.weeklyHours >= fc.maxWeekly) return false;

        // Unavailable slots check
        const isUnavailable = fc.unavailable.some(un => 
          un.day === day &&
          un.startTime < endTime &&
          un.endTime > startTime
        );
        if (isUnavailable) return false;
      }

      return true;
    };

    const isRoomFree = (roomId, day, startTime, endTime) => {
      if (!roomId) return false;
      return !grid.some(e =>
        e.roomId &&
        e.roomId.toString() === roomId.toString() &&
        e.day === day &&
        e.timeSlot.startTime < endTime &&
        e.timeSlot.endTime > startTime
      );
    };

    const incrementFacultyHours = (facultyId, day, count = 1) => {
      if (!facultyId) return;
      const fc = constraintsMap.get(facultyId.toString());
      if (fc) {
        fc.dailyHours[day] = (fc.dailyHours[day] || 0) + count;
        fc.weeklyHours += count;
      }
    };

    // Filter rooms by type
    const classroomRooms = rooms.filter((r) => r.type === 'classroom' && r.isActive);
    const labRooms = rooms.filter((r) => r.type === 'lab' && r.isActive);

    const roomPoolsFor = (subject) => {
      const preference = subject.roomType || (subject.type === 'lab' ? 'lab' : 'classroom');
      if (preference === 'lab') return [labRooms, classroomRooms];
      if (preference === 'classroom') return [classroomRooms, labRooms];
      return [classroomRooms, labRooms];
    };

    const pickRoom = (subject, day, startTime, endTime) => {
      for (const pool of roomPoolsFor(subject)) {
        const match = pool.find((r) => isRoomFree(r._id, day, startTime, endTime));
        if (match) return match;
      }
      return null;
    };

    const pickRoomForSlots = (subject, day, chosenSlots) => {
      for (const pool of roomPoolsFor(subject)) {
        const match = pool.find((r) =>
          chosenSlots.every((cs) =>
            isRoomFree(r._id, day, cs.slot.startTime, cs.slot.endTime),
          ),
        );
        if (match) return match;
      }
      return null;
    };

    // Separate subjects
    const labSubjects = subjects.filter(s => s.type === 'lab' && s.isActive);
    const theorySubjects = subjects.filter(s => s.type === 'theory' && s.isActive);

    // --- STEP 2: SCHEDULE LABS ---
    // Labs are high priority due to large, consecutive block constraints.
    labSubjects.forEach(sub => {
      // Lab duration in terms of slots
      const slotsNeeded = Math.ceil((sub.labDuration * 60) / lectureDuration);

      // Find all sections that need this subject
      const targetSections = [];
      const branchObj = config.branches.find(b => b.code === sub.branch);
      if (branchObj) {
        const yearObj = branchObj.years.find(y => y.yearNumber === sub.year);
        if (yearObj) {
          yearObj.sections.forEach(sec => {
            targetSections.push({ branch: sub.branch, year: sub.year, section: sec });
          });
        }
      }

      const sessionsPerWeek = Math.max(1, sub.weeklyHours || 1);

      targetSections.forEach(target => {
        let sessionsScheduled = 0;

        // Schedule each required lab session for the week
        for (const day of workingDays) {
          if (sessionsScheduled >= sessionsPerWeek) break;

          // Scan slots for consecutive free periods
          for (let i = 0; i <= timeSlots.length - slotsNeeded; i++) {
            let slotsValid = true;
            const chosenSlots = [];

            for (let j = 0; j < slotsNeeded; j++) {
              const currentSlotIndex = i + j;
              const slot = timeSlots[currentSlotIndex];

              // Cannot be a lunch break or any break
              if (slot.isBreak) {
                slotsValid = false;
                break;
              }

              // Find current grid state for this section, day, and slotIndex
              const gridEntry = grid.find(e => 
                e.branch === target.branch &&
                e.year === target.year &&
                e.section === target.section &&
                e.day === day &&
                e.slotIndex === currentSlotIndex
              );

              // Must be free
              if (!gridEntry || !gridEntry.isFree) {
                slotsValid = false;
                break;
              }

              // Faculty must be free
              if (!isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                slotsValid = false;
                break;
              }

              chosenSlots.push({ slot, gridEntry });
            }

            if (slotsValid && chosenSlots.length === slotsNeeded) {
              // Find a free lab room
              const freeLabRoom = pickRoomForSlots(sub, day, chosenSlots);

              if (freeLabRoom) {
                // Book the lab!
                chosenSlots.forEach(cs => {
                  cs.gridEntry.subjectId = sub._id;
                  cs.gridEntry.subjectName = sub.name;
                  cs.gridEntry.subjectType = 'lab';
                  cs.gridEntry.facultyId = sub.facultyId;
                  cs.gridEntry.facultyName = sub.facultyName || 'Faculty';
                  cs.gridEntry.roomId = freeLabRoom._id;
                  cs.gridEntry.roomName = freeLabRoom.name;
                  cs.gridEntry.isFree = false;

                  incrementFacultyHours(sub.facultyId, day, 1);
                });

                sessionsScheduled += 1;
                if (sessionsScheduled >= sessionsPerWeek) break;
              }
            }
          }
        }
      });
    });

    // --- STEP 3: SCHEDULE THEORY SUBJECTS ---
    // Sort theory subjects by weeklyHours descending (hardest first)
    const sortedTheory = [...theorySubjects].sort((a, b) => b.weeklyHours - a.weeklyHours);

    sortedTheory.forEach(sub => {
      // Find sections for this subject
      const targetSections = [];
      const branchObj = config.branches.find(b => b.code === sub.branch);
      if (branchObj) {
        const yearObj = branchObj.years.find(y => y.yearNumber === sub.year);
        if (yearObj) {
          yearObj.sections.forEach(sec => {
            targetSections.push({ branch: sub.branch, year: sub.year, section: sec });
          });
        }
      }

      targetSections.forEach(target => {
        let lecturesRemaining = sub.weeklyHours;

        // Try to distribute 1 lecture per day max
        const scheduledDays = new Set();

        const orderedDays = this._orderDaysForSubject(workingDays, sub);

        // Pass 1: Try placing with one-lecture-per-day restriction
        for (const day of orderedDays) {
          if (lecturesRemaining <= 0) break;
          if (scheduledDays.has(day)) continue;

          // Find a free classroom
          for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
            const slot = timeSlots[slotIndex];
            if (slot.isBreak) continue;

            const gridEntry = grid.find(e => 
              e.branch === target.branch &&
              e.year === target.year &&
              e.section === target.section &&
              e.day === day &&
              e.slotIndex === slotIndex
            );

            if (gridEntry && gridEntry.isFree) {
              if (isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                // Find a free classroom
                const freeRoom = pickRoom(sub, day, slot.startTime, slot.endTime);
                if (freeRoom) {
                  // Book the slot
                  gridEntry.subjectId = sub._id;
                  gridEntry.subjectName = sub.name;
                  gridEntry.subjectType = 'theory';
                  gridEntry.facultyId = sub.facultyId;
                  gridEntry.facultyName = sub.facultyName || 'Faculty';
                  gridEntry.roomId = freeRoom._id;
                  gridEntry.roomName = freeRoom.name;
                  gridEntry.isFree = false;

                  incrementFacultyHours(sub.facultyId, day, 1);
                  scheduledDays.add(day);
                  lecturesRemaining--;
                  break;
                }
              }
            }
          }
        }

        // Pass 2: If lectures are still remaining (e.g. weeklyHours > number of working days, or conflicts forced missed days)
        // Relax the daily constraint and place anywhere available.
        if (lecturesRemaining > 0) {
          for (const day of orderedDays) {
            if (lecturesRemaining <= 0) break;

            for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
              if (lecturesRemaining <= 0) break;
              const slot = timeSlots[slotIndex];
              if (slot.isBreak) continue;

              const gridEntry = grid.find(e => 
                e.branch === target.branch &&
                e.year === target.year &&
                e.section === target.section &&
                e.day === day &&
                e.slotIndex === slotIndex
              );

              if (gridEntry && gridEntry.isFree) {
                if (isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                  const freeRoom = pickRoom(sub, day, slot.startTime, slot.endTime);
                  if (freeRoom) {
                    gridEntry.subjectId = sub._id;
                    gridEntry.subjectName = sub.name;
                    gridEntry.subjectType = 'theory';
                    gridEntry.facultyId = sub.facultyId;
                    gridEntry.facultyName = sub.facultyName || 'Faculty';
                    gridEntry.roomId = freeRoom._id;
                    gridEntry.roomName = freeRoom.name;
                    gridEntry.isFree = false;

                    incrementFacultyHours(sub.facultyId, day, 1);
                    lecturesRemaining--;
                  }
                }
              }
            }
          }
        }
      });
    });

    // Run post-generation validations to get the conflict report
    const conflicts = ConflictDetector.validate(grid, subjects, facultyConstraints, config);

    return {
      entries: grid,
      conflicts: conflicts
    };
  }

  static _orderDaysForSubject(workingDays, subject) {
    const preferred = subject.preferredDays || [];
    if (!preferred.length) return workingDays;
    const preferredFirst = workingDays.filter((d) => preferred.includes(d));
    const rest = workingDays.filter((d) => !preferred.includes(d));
    return [...preferredFirst, ...rest];
  }
}

module.exports = SchedulingEngine;

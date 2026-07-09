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

    // ── College Timing Rules ──────────────────────────────────────────────
    const COLLEGE_START = '09:00';
    const COLLEGE_END   = '17:00';
    const LUNCH_WINDOW_START = '12:00';
    const LUNCH_WINDOW_END   = '14:00';

    // Filter out slots outside college hours
    const validTimeSlots = timeSlots.filter(slot => {
      return slot.startTime >= COLLEGE_START && slot.endTime <= COLLEGE_END;
    });

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
            validTimeSlots.forEach((slot, slotIndex) => {
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
                roomCapacity: null,
                isLunch: isLunch,
                isFree: !isLunch
              };

              grid.push(entry);
            });
          });
        });
      });
    });

    // ── Step 1.5: AI-Optimized Lunch Assignment ───────────────────────────
    // For each section on each day, assign exactly ONE lunch break in the
    // 12:00–14:00 window. The AI picks 12–1 or 1–2 based on morning workload:
    //   - If the section has ≥2 morning lectures (before 12:00) → earlier lunch (12:00)
    //   - Otherwise → later lunch (13:00) to allow more morning slots
    // This guarantees exactly one lunch per section per day.
    const lunchWindowSlots = validTimeSlots.filter(slot =>
      slot.startTime >= LUNCH_WINDOW_START && slot.endTime <= LUNCH_WINDOW_END
    );

    // If no explicit lunch slot in config, dynamically find best lunch slot per section/day
    const hasConfigLunch = validTimeSlots.some(s => s.isBreak && s.breakType === 'lunch');
    if (!hasConfigLunch && lunchWindowSlots.length > 0) {
      config.branches.forEach(branch => {
        branch.years.forEach(year => {
          year.sections.forEach(section => {
            workingDays.forEach(day => {
              // Count morning lectures already planned (before 12:00)
              const morningSlotCount = validTimeSlots.filter(
                s => s.endTime <= LUNCH_WINDOW_START && !s.isBreak
              ).length;

              // AI decision: early lunch if heavy morning (>=2 morning slots), else late lunch
              const pickEarlyLunch = morningSlotCount >= 2;
              const preferredLunch = pickEarlyLunch
                ? lunchWindowSlots.find(s => s.startTime === '12:00')
                : lunchWindowSlots.find(s => s.startTime === '13:00');
              const chosenLunch = preferredLunch || lunchWindowSlots[0];

              // Mark this slot as lunch for the section/day in grid
              const gridEntry = grid.find(e =>
                e.branch === branch.code &&
                e.year === year.yearNumber &&
                e.section === section &&
                e.day === day &&
                e.timeSlot.startTime === chosenLunch.startTime
              );
              if (gridEntry && gridEntry.isFree) {
                gridEntry.subjectName = 'Lunch Break';
                gridEntry.subjectType = 'lunch';
                gridEntry.isLunch = true;
                gridEntry.isFree = false;
              }
            });
          });
        });
      });
    }

    // Helper functions to check if resources are free
    const isFacultyFree = (facultyId, day, startTime, endTime) => {
      if (!facultyId) return true;

      // Reject slots outside college hours (9 AM – 5 PM)
      if (startTime < '09:00' || endTime > '17:00') return false;
      
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

    const getSectionStudentCount = (branch, year, section) => {
      const key = `${branch}::${year}::${section}`;
      return config.studentCounts?.[key] || 15; // default fallback if empty
    };

    const pickRoom = (subject, day, startTime, endTime, studentCount = 15) => {
      for (const pool of roomPoolsFor(subject)) {
        const eligible = pool
          .filter(r => r.capacity >= studentCount && isRoomFree(r._id, day, startTime, endTime))
          .sort((a, b) => a.capacity - b.capacity);
        if (eligible.length > 0) return eligible[0];
        
        const match = pool
          .filter(r => isRoomFree(r._id, day, startTime, endTime))
          .sort((a, b) => b.capacity - a.capacity)[0];
        if (match) return match;
      }
      return null;
    };

    const pickRoomForSlots = (subject, day, chosenSlots, studentCount = 15) => {
      for (const pool of roomPoolsFor(subject)) {
        const eligible = pool
          .filter(r => r.capacity >= studentCount && chosenSlots.every(cs => isRoomFree(r._id, day, cs.slot.startTime, cs.slot.endTime)))
          .sort((a, b) => a.capacity - b.capacity);
        if (eligible.length > 0) return eligible[0];

        const match = pool
          .filter(r => chosenSlots.every(cs => isRoomFree(r._id, day, cs.slot.startTime, cs.slot.endTime)))
          .sort((a, b) => b.capacity - a.capacity)[0];
        if (match) return match;
      }
      return null;
    };

    // Separate subjects
    const labSubjects = subjects.filter(s => s.type === 'lab' && s.isActive);
    const theorySubjects = subjects.filter(s => s.type === 'theory' && s.isActive);

    // Use validTimeSlots for scheduling (enforces 9AM-5PM)
    const scheduleSlots = validTimeSlots;

    // --- STEP 2: SCHEDULE LABS ---
    labSubjects.forEach(sub => {
      const slotsNeeded = Math.ceil((sub.labDuration * 60) / lectureDuration);

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

      // Every laboratory subject gets exactly one lab session per week
      const sessionsPerWeek = 1;

      targetSections.forEach(target => {
        let sessionsScheduled = 0;
        const studentCount = getSectionStudentCount(target.branch, target.year, target.section);

        for (const day of workingDays) {
          if (sessionsScheduled >= sessionsPerWeek) break;

          for (let i = 0; i <= scheduleSlots.length - slotsNeeded; i++) {
            let slotsValid = true;
            const chosenSlots = [];

            for (let j = 0; j < slotsNeeded; j++) {
              const currentSlotIndex = i + j;
              const slot = scheduleSlots[currentSlotIndex];

              if (slot.isBreak) {
                slotsValid = false;
                break;
              }

              // Skip slots outside college hours
              if (slot.startTime < '09:00' || slot.endTime > '17:00') {
                slotsValid = false;
                break;
              }

              // Find entry in grid using startTime (since validTimeSlots rebases slotIndex)
              const gridEntry = grid.find(e => 
                e.branch === target.branch &&
                e.year === target.year &&
                e.section === target.section &&
                e.day === day &&
                e.timeSlot.startTime === slot.startTime
              );

              if (!gridEntry || !gridEntry.isFree) {
                slotsValid = false;
                break;
              }

              if (!isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                slotsValid = false;
                break;
              }

              chosenSlots.push({ slot, gridEntry });
            }

            if (slotsValid && chosenSlots.length === slotsNeeded) {
              const freeLabRoom = pickRoomForSlots(sub, day, chosenSlots, studentCount);

              if (freeLabRoom) {
                chosenSlots.forEach(cs => {
                  cs.gridEntry.subjectId = sub._id;
                  cs.gridEntry.subjectName = sub.name;
                  cs.gridEntry.subjectType = 'lab';
                  cs.gridEntry.facultyId = sub.facultyId;
                  cs.gridEntry.facultyName = sub.facultyName || 'Faculty';
                  cs.gridEntry.roomId = freeLabRoom._id;
                  cs.gridEntry.roomName = freeLabRoom.name;
                  cs.gridEntry.roomCapacity = freeLabRoom.capacity;
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

        const studentCount = getSectionStudentCount(target.branch, target.year, target.section);

        // Try to distribute 1 lecture per day max
        const scheduledDays = new Set();

        const orderedDays = this._orderDaysForSubject(workingDays, sub);

        // Pass 1: Try placing with one-lecture-per-day restriction
        for (const day of orderedDays) {
          if (lecturesRemaining <= 0) break;
          if (scheduledDays.has(day)) continue;

          // Find a free classroom
          for (let slotIndex = 0; slotIndex < scheduleSlots.length; slotIndex++) {
            const slot = scheduleSlots[slotIndex];
            if (slot.isBreak) continue;

            // Enforce college hours
            if (slot.startTime < '09:00' || slot.endTime > '17:00') continue;

            const gridEntry = grid.find(e => 
              e.branch === target.branch &&
              e.year === target.year &&
              e.section === target.section &&
              e.day === day &&
              e.timeSlot.startTime === slot.startTime
            );

            if (gridEntry && gridEntry.isFree) {
              if (isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                // Find a free classroom
                const freeRoom = pickRoom(sub, day, slot.startTime, slot.endTime, studentCount);
                if (freeRoom) {
                  // Book the slot
                  gridEntry.subjectId = sub._id;
                  gridEntry.subjectName = sub.name;
                  gridEntry.subjectType = 'theory';
                  gridEntry.facultyId = sub.facultyId;
                  gridEntry.facultyName = sub.facultyName || 'Faculty';
                  gridEntry.roomId = freeRoom._id;
                  gridEntry.roomName = freeRoom.name;
                  gridEntry.roomCapacity = freeRoom.capacity;
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

            for (let slotIndex = 0; slotIndex < scheduleSlots.length; slotIndex++) {
              if (lecturesRemaining <= 0) break;
              const slot = scheduleSlots[slotIndex];
              if (slot.isBreak) continue;

              // Enforce college hours
              if (slot.startTime < '09:00' || slot.endTime > '17:00') continue;

              const gridEntry = grid.find(e => 
                e.branch === target.branch &&
                e.year === target.year &&
                e.section === target.section &&
                e.day === day &&
                e.timeSlot.startTime === slot.startTime
              );

              if (gridEntry && gridEntry.isFree) {
                if (isFacultyFree(sub.facultyId, day, slot.startTime, slot.endTime)) {
                  const freeRoom = pickRoom(sub, day, slot.startTime, slot.endTime, studentCount);
                  if (freeRoom) {
                    gridEntry.subjectId = sub._id;
                    gridEntry.subjectName = sub.name;
                    gridEntry.subjectType = 'theory';
                    gridEntry.facultyId = sub.facultyId;
                    gridEntry.facultyName = sub.facultyName || 'Faculty';
                    gridEntry.roomId = freeRoom._id;
                    gridEntry.roomName = freeRoom.name;
                    gridEntry.roomCapacity = freeRoom.capacity;
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

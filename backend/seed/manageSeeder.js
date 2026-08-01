/**
 * Seeds normalized Phase 2 manage entities (academic year, departments, branches, etc.)
 * Run: node seed/manageSeeder.js
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TtAcademicYear = require('../models/TtAcademicYear');
const TtDepartment = require('../models/TtDepartment');
const TtBranch = require('../models/TtBranch');
const TtSemester = require('../models/TtSemester');
const TtSection = require('../models/TtSection');
const TtWorkingDay = require('../models/TtWorkingDay');
const TtLectureSlot = require('../models/TtLectureSlot');
const TtLunchBreak = require('../models/TtLunchBreak');

const SECTION_LABELS = ['A', 'B'];

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not defined');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  let ay = await TtAcademicYear.findOne({ label: '2026-27', isActive: true });
  if (!ay) {
    ay = await TtAcademicYear.create({
      label: '2026-27',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
    });
    await TtAcademicYear.updateMany({ _id: { $ne: ay._id } }, { isCurrent: false });
    console.log('Created academic year 2026-27');
  }

  let dept = await TtDepartment.findOne({ code: 'CS', isActive: true });
  if (!dept) {
    dept = await TtDepartment.create({ code: 'CS', name: 'Computer Science & Engineering' });
    console.log('Created department CS');
  }

  const branchDefs = [
    { code: 'BTECH', name: 'Bachelor of Technology', years: 4 },
    { code: 'BBA', name: 'Bachelor of Business Administration', years: 3 },
    { code: 'BDES', name: 'Bachelor of Design', years: 4 },
  ];

  for (const def of branchDefs) {
    let branch = await TtBranch.findOne({ code: def.code, academicYearId: ay._id, isActive: true });
    if (!branch) {
      branch = await TtBranch.create({
        code: def.code,
        name: def.name,
        academicYearId: ay._id,
        departmentId: dept._id,
      });
      console.log(`Created branch ${def.code}`);

      for (let y = 1; y <= def.years; y++) {
        for (let semOffset = 0; semOffset < 2; semOffset++) {
          const semesterNumber = (y - 1) * 2 + semOffset + 1;
          if (semesterNumber > def.years * 2) break;
          let sem = await TtSemester.findOne({ branchId: branch._id, semesterNumber, academicYearId: ay._id, isActive: true });
          if (!sem) {
            sem = await TtSemester.create({
              semesterNumber,
              year: Math.ceil(semesterNumber / 2),
              branchId: branch._id,
              academicYearId: ay._id,
            });
            for (const label of SECTION_LABELS) {
              await TtSection.create({
                label,
                semesterId: sem._id,
                branchId: branch._id,
                studentCount: 60,
              });
            }
          }
        }
      }
    }
  }

  const existingDays = await TtWorkingDay.countDocuments({ academicYearId: ay._id, isActive: true });
  if (existingDays === 0) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    for (let i = 0; i < days.length; i++) {
      await TtWorkingDay.create({ dayName: days[i], dayOrder: i + 1, academicYearId: ay._id });
    }
    console.log('Created working days');
  }

  const existingSlots = await TtLectureSlot.countDocuments({ academicYearId: ay._id, isActive: true });
  if (existingSlots === 0) {
    const slots = [
      { label: '09:00 - 09:50', startTime: '09:00', endTime: '09:50', slotNumber: 1, duration: 50, isBreak: false },
      { label: '10:00 - 10:50', startTime: '10:00', endTime: '10:50', slotNumber: 2, duration: 50, isBreak: false },
      { label: '11:00 - 11:50', startTime: '11:00', endTime: '11:50', slotNumber: 3, duration: 50, isBreak: false },
      { label: '13:00 - 14:00', startTime: '13:00', endTime: '14:00', slotNumber: 4, duration: 60, isBreak: true, breakType: 'lunch' },
      { label: '14:00 - 14:50', startTime: '14:00', endTime: '14:50', slotNumber: 5, duration: 50, isBreak: false },
      { label: '15:00 - 15:50', startTime: '15:00', endTime: '15:50', slotNumber: 6, duration: 50, isBreak: false },
    ];
    for (const s of slots) {
      await TtLectureSlot.create({ ...s, academicYearId: ay._id });
    }
    console.log('Created lecture slots');
  }

  const existingLunch = await TtLunchBreak.findOne({ academicYearId: ay._id, isActive: true });
  if (!existingLunch) {
    await TtLunchBreak.create({ startTime: '13:00', endTime: '14:00', duration: 60, academicYearId: ay._id });
    console.log('Created lunch break');
  }

  console.log('✅ Manage seeder complete. Academic Year ID:', ay._id.toString());
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeder failed:', err.message);
  process.exit(1);
});

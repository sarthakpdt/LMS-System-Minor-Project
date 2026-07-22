const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const TtConfig = require('../models/TtConfig');
const TtSubject = require('../models/TtSubject');
const TtRoom = require('../models/TtRoom');
const TtFacultyConstraint = require('../models/TtFacultyConstraint');
const Teacher = require('../models/Teacher');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Clean up existing Timetable data (but NOT teachers, unless seeding dummy ones)
    console.log('Cleaning up existing timetable collections...');
    await TtConfig.deleteMany({});
    await TtSubject.deleteMany({});
    await TtRoom.deleteMany({});
    await TtFacultyConstraint.deleteMany({});
    console.log('Cleanup complete.');

    // 2. Ensure we have approved teachers in the database to map
    console.log('Checking for teachers...');
    let teachers = await Teacher.find({ approvalStatus: 'approved' });

    if (teachers.length === 0) {
      console.log('No approved teachers found. Seeding dummy teachers...');
      const dummyTeachers = [
        {
          name: 'Dr. Sharma',
          email: 'sharma@edutrack.com',
          password: 'password123', // in real apps this is hashed, but for seeding it's okay or we can bcrypt
          phone: '9876543210',
          employeeId: 'EMP001',
          department: 'CS',
          approvalStatus: 'approved'
        },
        {
          name: 'Dr. Gupta',
          email: 'gupta@edutrack.com',
          password: 'password123',
          phone: '9876543211',
          employeeId: 'EMP002',
          department: 'CS',
          approvalStatus: 'approved'
        },
        {
          name: 'Dr. Jain',
          email: 'jain@edutrack.com',
          password: 'password123',
          phone: '9876543212',
          employeeId: 'EMP003',
          department: 'CS',
          approvalStatus: 'approved'
        },
        {
          name: 'Dr. Patil',
          email: 'patil@edutrack.com',
          password: 'password123',
          phone: '9876543213',
          employeeId: 'EMP004',
          department: 'Other',
          approvalStatus: 'approved'
        }
      ];

      teachers = await Teacher.create(dummyTeachers);
      console.log(`✅ Seeded ${teachers.length} dummy approved teachers.`);
    } else {
      console.log(`Found ${teachers.length} existing approved teachers.`);
    }

    // 3. Seed Timetable Configuration
    console.log('Seeding TtConfig...');
    const config = await TtConfig.create({
      academicYear: '2026-27',
      branches: [
        {
          code: 'BTECH',
          name: 'Bachelor of Technology',
          years: [
            { yearNumber: 1, label: 'First Year', sections: ['A', 'B'] },
            { yearNumber: 2, label: 'Second Year', sections: ['A', 'B'] },
            { yearNumber: 3, label: 'Third Year', sections: ['A'] }
          ]
        },
        {
          code: 'BBA',
          name: 'Bachelor of Business Administration',
          years: [
            { yearNumber: 1, label: 'First Year', sections: ['A'] },
            { yearNumber: 2, label: 'Second Year', sections: ['A'] }
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
    console.log('✅ Seeded TtConfig.');

    // 4. Seed Rooms
    console.log('Seeding TtRooms...');
    const rooms = await TtRoom.create([
      { name: 'Room 101', type: 'classroom', capacity: 60 },
      { name: 'Room 102', type: 'classroom', capacity: 60 },
      { name: 'Room 103', type: 'classroom', capacity: 60 },
      { name: 'Computer Lab A', type: 'lab', capacity: 30, labType: 'Computer' },
      { name: 'Computer Lab B', type: 'lab', capacity: 30, labType: 'Computer' },
      { name: 'Electronics Lab', type: 'lab', capacity: 30, labType: 'Electronics' }
    ]);
    console.log(`✅ Seeded ${rooms.length} TtRooms.`);

    // 5. Seed Subjects with Teacher assignments
    console.log('Seeding TtSubjects...');
    const sharma = teachers.find(t => t.name.includes('Sharma')) || teachers[0];
    const gupta = teachers.find(t => t.name.includes('Gupta')) || teachers[0];
    const jain = teachers.find(t => t.name.includes('Jain')) || teachers[0];
    const patil = teachers.find(t => t.name.includes('Patil')) || teachers[0];

    const subjects = await TtSubject.create([
      // BTech Year 1
      {
        name: 'Mathematics I',
        code: 'MATH101',
        type: 'theory',
        branch: 'BTECH',
        year: 1,
        weeklyHours: 4,
        facultyId: patil._id,
        facultyName: patil.name
      },
      {
        name: 'Programming in C',
        code: 'CS101',
        type: 'theory',
        branch: 'BTECH',
        year: 1,
        weeklyHours: 3,
        facultyId: sharma._id,
        facultyName: sharma.name
      },
      {
        name: 'Programming Lab',
        code: 'CS101P',
        type: 'lab',
        branch: 'BTECH',
        year: 1,
        weeklyHours: 2, // 2 slots (consecutive)
        labDuration: 2, // 2 hours
        facultyId: sharma._id,
        facultyName: sharma.name
      },

      // BTech Year 2
      {
        name: 'Database Management Systems',
        code: 'CS201',
        type: 'theory',
        branch: 'BTECH',
        year: 2,
        weeklyHours: 4,
        facultyId: gupta._id,
        facultyName: gupta.name
      },
      {
        name: 'DBMS Lab',
        code: 'CS201P',
        type: 'lab',
        branch: 'BTECH',
        year: 2,
        weeklyHours: 2,
        labDuration: 2,
        facultyId: gupta._id,
        facultyName: gupta.name
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS202',
        type: 'theory',
        branch: 'BTECH',
        year: 2,
        weeklyHours: 4,
        facultyId: jain._id,
        facultyName: jain.name
      },
      {
        name: 'DSA Lab',
        code: 'CS202P',
        type: 'lab',
        branch: 'BTECH',
        year: 2,
        weeklyHours: 2,
        labDuration: 2,
        facultyId: jain._id,
        facultyName: jain.name
      },

      // BBA Year 1
      {
        name: 'Business Economics',
        code: 'BBA101',
        type: 'theory',
        branch: 'BBA',
        year: 1,
        weeklyHours: 3,
        facultyId: patil._id,
        facultyName: patil.name
      },
      {
        name: 'Financial Accounting',
        code: 'BBA102',
        type: 'theory',
        branch: 'BBA',
        year: 1,
        weeklyHours: 4,
        facultyId: patil._id,
        facultyName: patil.name
      }
    ]);
    console.log(`✅ Seeded ${subjects.length} TtSubjects.`);

    // 6. Seed Faculty Constraints
    console.log('Seeding TtFacultyConstraints...');
    await TtFacultyConstraint.create([
      {
        facultyId: sharma._id,
        facultyName: sharma.name,
        unavailableSlots: [
          { day: 'Friday', startTime: '14:00', endTime: '16:00', reason: 'Research Meeting' }
        ],
        maxHoursPerDay: 5,
        maxHoursPerWeek: 15
      },
      {
        facultyId: gupta._id,
        facultyName: gupta.name,
        unavailableSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '12:00', reason: 'Admin Work' }
        ],
        maxHoursPerDay: 4,
        maxHoursPerWeek: 16
      }
    ]);
    console.log('✅ Seeded TtFacultyConstraints.');

    console.log('🎉 Database seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seed();

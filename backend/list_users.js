const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Admin = require('./models/Admin');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to primary database.');

    const students = await Student.find({}, 'name email role approvalStatus studentId');
    const teachers = await Teacher.find({}, 'name email role approvalStatus employeeId');
    const admins = await Admin.find({}, 'name email role');

    console.log('\n--- ADMINS ---');
    console.log(JSON.stringify(admins, null, 2));

    console.log('\n--- TEACHERS ---');
    console.log(JSON.stringify(teachers, null, 2));

    console.log('\n--- STUDENTS ---');
    console.log(JSON.stringify(students, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();

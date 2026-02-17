const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phoneNo,
      dob,

      studentId,
      department,
      semester,

      teacherId,
      specialization,
      qualification
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      phoneNo,
      dob
    });

    // ✅ CREATE ROLE BASED DATA
    if (role === 'student') {
      await Student.create({
        userId: newUser._id,
        studentId,
        department,
        semester
      });
    }

    if (role === 'teacher') {
      await Teacher.create({
        userId: newUser._id,
        teacherId,
        specialization,
        qualification
      });
    }

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, ...additionalData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and role are all required',
      });
    }

    let Model;
    if (role === 'student') {
      Model = Student;
      if (!additionalData.studentId) {
        return res.status(400).json({ success: false, message: 'studentId is required for students' });
      }
    } else if (role === 'teacher') {
      Model = Teacher;
      if (!additionalData.employeeId) {
        return res.status(400).json({ success: false, message: 'employeeId is required for teachers' });
      }
    } else if (role === 'admin') {
      Model = Admin;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be student, teacher, or admin' });
    }

    const existing = await Model.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Model.create({
      name,
      email,
      password: hashedPassword,
      ...additionalData,
    });

    res.status(201).json({
      success: true,
      message: role === 'student'
        ? 'Registration successful! Your account is pending admin approval.'
        : 'Registration successful!',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        approvalStatus: user.approvalStatus || 'pending',
        semester: user.semester || null,
        department: user.department || null,
        studentId: user.studentId || null,
        employeeId: user.employeeId || null,
        phone: user.phone || null,
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field} already exists` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'email, password, and role are required' });
    }

    let Model;
    if (role === 'student') Model = Student;
    else if (role === 'teacher') Model = Teacher;
    else if (role === 'admin') Model = Admin;
    else return res.status(400).json({ success: false, message: 'Invalid role' });

    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (role === 'student' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        approvalStatus: user.approvalStatus || null,
        semester: user.semester || null,
        department: user.department || null,
        studentId: user.studentId || null,
        employeeId: user.employeeId || null,
        phone: user.phone || null,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

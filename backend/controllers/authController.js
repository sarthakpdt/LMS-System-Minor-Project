const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtUtil');



// ─── Helper: build teacher user payload ───────────────────────────────────────
const buildTeacherPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: 'teacher',
  approvalStatus: user.approvalStatus || 'pending',
  department: user.department || null,
  specialization: user.specialization || null,
  employeeId: user.employeeId || null,
  phone: user.phone || null,
  assignedCourses: (user.assignedCourses || [])
    .filter((c) => c && c.courseId)
    .map((c) => ({
      courseId: String(c.courseId),
      courseCode: c.courseCode || '',
      courseName: c.courseName || c.courseCode || '',
      semester: c.semester,
    })),
});

// POST /api/auth/register
const register = async (req, res) => {
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
      if (!additionalData.phone) {
        return res.status(400).json({ success: false, message: 'phone number is required for students' });
      }
      if (additionalData.semester) {
        additionalData.semester = String(additionalData.semester).replace(/[^0-9]/g, '');
      }
    } else if (role === 'teacher') {
      Model = Teacher;
      if (!additionalData.employeeId) {
        return res.status(400).json({ success: false, message: 'employeeId is required for teachers' });
      }
      // phone is mandatory in schema; validate early for clearer error
      if (!additionalData.phone) {
        return res.status(400).json({ success: false, message: 'phone number is required for teachers' });
      }
      // you may also enforce department if desired
      if (!additionalData.department) {
        // not returning error, just defaulting later; uncomment to enforce
        // return res.status(400).json({ success: false, message: 'department is required for teachers' });
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
    // Ensure required fields have defaults for students to pass validation
    if (role === 'student') {
      additionalData.department = additionalData.department || 'Other';
      additionalData.semester = additionalData.semester || '1';
    }
    const user = await Model.create({
      name,
      email,
      password: hashedPassword,
      ...additionalData,
    });

    const payload = {
      success: true,
      message: role === 'student'
        ? 'Registration successful! Your account is pending admin approval.'
        : 'Registration successful!',
      user: role === 'teacher'
        ? buildTeacherPayload(user)
        : {
            id: user._id,
            name: user.name,
            email: user.email,
            role,
            approvalStatus: user.approvalStatus || 'pending',
            semester: user.semester || null,
            department: user.department || null,
            studentId: user.studentId || null,
            employeeId: user.employeeId || null,
            phone: user.phone || null,
          },
    };

    payload.token = generateToken(user._id, role);

    res.status(201).json(payload);

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
const login = async (req, res) => {
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

    // Approval check removed to allow login for all students


    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token: generateToken(user._id, role),
      user: role === 'teacher'
        ? buildTeacherPayload(user)
        : {
            id: user._id,
            name: user.name,
            email: user.email,
            role,
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

module.exports = { register, login };  
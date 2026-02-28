const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to create a Login Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, ...additionalData } = req.body;

    // Validation: Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, email, password' 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    let Model;

    // Choose model based on role
    if (role === 'student') {
      Model = Student;
      if (!additionalData.studentId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID is required for students' 
        });
      }
    } else if (role === 'teacher') {
      Model = Teacher;
      if (!additionalData.employeeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID is required for teachers' 
        });
      }
    } else if (role === 'admin') {
      Model = Admin;
      if (!additionalData.employeeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID is required for admins' 
        });
      }
    }

    // Check if user exists
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create user with appropriate model
    user = await Model.create({
      name,
      email,
      password: hashedPassword,
      ...additionalData
    });

    res.status(201).json({
      success: true,
      message: `Registration successful! Your account is ${role === 'student' ? 'pending admin approval' : 'pending verification'}`,
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: role,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field} already exists` 
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and role are required' 
      });
    }

    // Choose model based on role
    let Model;
    if (role === 'student') {
      Model = Student;
    } else if (role === 'teacher') {
      Model = Teacher;
    } else if (role === 'admin') {
      Model = Admin;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    // Find user by email
    const user = await Model.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check approval status for students
    if (role === 'student' && user.approvalStatus !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: `Your account is ${user.approvalStatus}. Please wait for admin approval.` 
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome ${user.name}!`,
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: role,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
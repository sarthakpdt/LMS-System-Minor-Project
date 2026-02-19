const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // You will need to run: npm install bcryptjs

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

    // 1. Validation: Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 2. Security: Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Database: Save user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      ...additionalData
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: generateToken(user._id),
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    
    // 2. Check if user exists and password matches
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        data: {
          user: { id: user._id, name: user.name, email: user.email, role: user.role }
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
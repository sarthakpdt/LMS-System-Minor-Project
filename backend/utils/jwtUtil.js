// utils/jwtUtil.js
// Centralized JWT generation utility

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

/**
 * Generate a JWT token for a user.
 * @param {string|ObjectId} id - User identifier.
 * @param {string} role - User role (admin, teacher, student).
 * @returns {string} Signed JWT token.
 */
function generateToken(id, role) {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { generateToken };

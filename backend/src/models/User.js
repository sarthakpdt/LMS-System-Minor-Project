const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNo: String,
  dob: Date
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
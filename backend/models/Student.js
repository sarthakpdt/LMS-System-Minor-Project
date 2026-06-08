const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date },

  // Student Info
  studentId: { type: String, required: true, unique: true },
  department: {
    type: String,
    required: true,
    enum: ['CS', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CH', 'BT', 'MBA', 'MCA', 'Other'],
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
  enrollmentYear: { type: Number },

  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  approvalDate: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  // Academic Info
  gpa: { type: Number, min: 0, max: 4.0, default: 0 },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },

  // Enrolled Courses (populated by admin enrollment action)
  enrolledCourses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    courseCode: String,
    courseName: String,
    semester: String,
    department: String,
  }],

  // Legacy courses field (quiz marks etc.)
  courses: [{
    courseId: mongoose.Schema.Types.ObjectId,
    courseCode: String,
    courseName: String,
    marks: Number,
    grade: String,
  }],

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);

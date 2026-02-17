const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: String,
  department: String,
  semester: Number
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

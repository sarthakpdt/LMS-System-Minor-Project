const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: String,
  specialization: String,
  qualification: String
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);

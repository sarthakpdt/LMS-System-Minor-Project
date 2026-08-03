const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  notificationType: { type: String, required: true }, // e.g. 'fee_reminder'
  deliveryChannel: { type: String, enum: ['Email', 'SMS'], required: true },
  messageContent: { type: String, required: true },
  deliveryStatus: { type: String, enum: ['Success', 'Failed'], required: true },
  errorDetails: { type: String, default: null },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);

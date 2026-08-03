const mongoose = require('mongoose');
const { accountsConnection } = require('../lib/mongodb');

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String },
  signature: { type: String },
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  rollNo: { type: String, required: true },
  program: { type: String, required: true },
  feeCategory: { type: String, enum: ['Academic', 'Hostel', 'Mess', 'Other'], default: 'Academic' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['created', 'success', 'failed'], default: 'created' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = accountsConnection.model('Payment', paymentSchema);

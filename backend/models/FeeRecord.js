const mongoose = require('mongoose');
const { accountsConnection } = require('../lib/mongodb');

const feeRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // links to Student.studentId
  rollNo: { type: String, required: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  semester: { type: Number, required: true },
  paymentPlan: { type: String, enum: ['annual', 'semester'], default: 'semester' },
  academicFee: { type: Number, default: 0 },
  hostelFee: { type: Number, default: 0 },
  messFee: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  totalFee: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  feeStatus: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
  lastPaymentDate: { type: String, default: '-' },
  dueDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  lastReminderSent: { type: Date, default: null },
  scholarship: {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    type: { type: String, enum: ['merit', 'need-based', 'sports', 'other', ''], default: '' },
    status: { type: String, enum: ['active', 'applied', 'inactive', ''], default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = accountsConnection.model('FeeRecord', feeRecordSchema);

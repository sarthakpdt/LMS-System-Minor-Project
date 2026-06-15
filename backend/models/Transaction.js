const mongoose = require('mongoose');
const { accountsConnection } = require('../lib/mongodb');

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // TXNXXXXXXXX
  studentName: { type: String, required: true },
  rollNo: { type: String, required: true },
  program: { type: String, required: true },
  type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
  feeCategory: { type: String, enum: ['Academic', 'Hostel', 'Mess', 'Other'], default: 'Academic' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'NEFT', 'RTGS', 'Card', 'Cash'], default: 'UPI' },
  date: { type: String, required: true }, // "28 Jan" or full date
  time: { type: String, required: true }, // "2:34 PM"
  status: { type: String, enum: ['Pending', 'Payment Submitted', 'Under Verification', 'Paid', 'Rejected', 'completed', 'processing'], default: 'Under Verification' },
  referenceNumber: { type: String, default: '-' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = accountsConnection.model('Transaction', transactionSchema);

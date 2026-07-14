const express = require('express');
const router = express.Router();
const FeeRecord = require('../models/FeeRecord');
const Transaction = require('../models/Transaction');
const NotificationService = require('../services/NotificationService');
const NotificationLog = require('../models/NotificationLog');

const calculateGpaScholarship = (gpa, academicFee) => {
  if (!gpa || gpa < 7.5) return { amount: 0, pct: 0 };
  let pct = 0;
  if (gpa >= 9.5) pct = 100;
  else if (gpa >= 9.0) pct = 75;
  else if (gpa >= 8.5) pct = 50;
  else if (gpa >= 8.0) pct = 25;
  else if (gpa >= 7.5) pct = 15;
  
  return {
    amount: Math.round(academicFee * (pct / 100)),
    pct
  };
};

// Sync helper to bridge registered student DB with the Accounts DB
const syncFeeRecords = async () => {
  try {
    const Student = require('../models/Student');
    const dbStudents = await Student.find({});
    
    // Extract real studentIds
    const realStudentIds = dbStudents.map(s => s.studentId).filter(Boolean);
    
    // Delete old mock/sample data that is not associated with a registered student
    await FeeRecord.deleteMany({ studentId: { $nin: realStudentIds } });
    await Transaction.deleteMany({ rollNo: { $nin: realStudentIds } });

    // Sync real students to FeeRecord
    for (const student of dbStudents) {
      if (!student.studentId) continue;

      let record = await FeeRecord.findOne({ studentId: student.studentId });
      const program = student.department === 'CS' ? 'B.Tech (CSE)' : 
                      student.department === 'IT' ? 'B.Tech (IT)' : 
                      student.department === 'MBA' ? 'MBA' : 'Other';
      const semester = Number(student.semester) || 1;

      if (!record) {
        record = new FeeRecord({
          studentId: student.studentId,
          rollNo: student.studentId,
          name: student.name,
          program: program,
          semester: semester,
          paymentPlan: 'semester',
          academicFee: 92500,
          hostelFee: 36000,
          messFee: 24000,
          otherCharges: 6500,
          paidAmount: 0,
          lastPaymentDate: '-',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastReminderSent: null
        });
      }

      // Sync updated fields
      record.name = student.name;
      record.program = program;
      record.semester = semester;
      if (!record.dueDate) {
        record.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      // Calculate GPA-based scholarship
      const hasManualScholarship = record.scholarship && record.scholarship.id && record.scholarship.id !== 'AUTO_GPA';
      if (!hasManualScholarship) {
        const { amount: autoAmt, pct: autoPct } = calculateGpaScholarship(student.gpa, record.academicFee);
        if (autoPct > 0) {
          record.scholarship = {
            id: 'AUTO_GPA',
            name: `GPA Merit Scholarship (${autoPct}%)`,
            amount: autoAmt,
            type: 'merit',
            status: 'active'
          };
        } else {
          record.scholarship = {
            id: '',
            name: '',
            amount: 0,
            type: '',
            status: ''
          };
        }
      }

      // Recalculate totalFee, dueAmount and status
      const baseFee = record.academicFee + record.hostelFee + record.messFee + record.otherCharges;
      record.totalFee = baseFee - (record.scholarship ? record.scholarship.amount : 0);
      record.dueAmount = Math.max(0, record.totalFee - record.paidAmount);

      if (record.dueAmount === 0) {
        record.feeStatus = 'paid';
      } else if (record.paidAmount > 0) {
        record.feeStatus = 'partial';
      } else {
        record.feeStatus = 'pending';
      }

      await record.save();
    }
    console.log('🔄 Synced Accounts DB FeeRecords with Student DB successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing fee records:', error);
  }
};


// Admin Accounts Routes
router.get('/accounts/stats', async (req, res) => {
  try {
    await syncFeeRecords();
    const feeRecords = await FeeRecord.find({});
    
    // Aggregations
    let totalCollected = 0;
    let totalPending = 0;
    let paidFullCount = 0;
    let overdueBalance = 0;
    let totalStudentsCount = feeRecords.length;

    feeRecords.forEach(record => {
      totalCollected += record.paidAmount;
      totalPending += record.dueAmount;
      if (record.feeStatus === 'paid') {
        paidFullCount++;
      }
      if (record.feeStatus === 'overdue') {
        overdueBalance += record.dueAmount;
      }
    });

    res.json({
      success: true,
      stats: {
        totalCollected,
        totalPending,
        paidFullCount,
        overdueBalance,
        totalStudentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/accounts/students', async (req, res) => {
  try {
    await syncFeeRecords();
    const students = await FeeRecord.find({}).sort({ rollNo: 1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/accounts/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/accounts/remind', async (req, res) => {
  try {
    const { studentId, force, adminId } = req.body;
    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    if (record.dueAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Student does not have any pending fees' });
    }

    // Accidental duplicate reminder safeguard (24-hour limit) - disabled for testing phase
    if (false && record.lastReminderSent && !force) {
      const hoursSinceLast = (new Date() - new Date(record.lastReminderSent)) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        return res.json({
          success: false,
          duplicate: true,
          message: `A reminder was already sent to ${record.name} within the last 24 hours (on ${new Date(record.lastReminderSent).toLocaleString('en-IN')}). Do you want to send it again?`
        });
      }
    }

    const Student = require('../models/Student');
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Registered student details not found' });
    }

    const result = await NotificationService.sendNotification({
      student,
      type: 'fee_reminder',
      data: {
        dueAmount: record.dueAmount,
        dueDate: record.dueDate
      },
      initiatedBy: adminId || (req.user ? req.user.id : null)
    });

    res.json({
      success: true,
      message: `Reminder processed for ${record.name}`,
      details: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/accounts/remind-all', async (req, res) => {
  try {
    const { force, adminId } = req.body;
    
    // Find all students with pending fee dues
    const records = await FeeRecord.find({ dueAmount: { $gt: 0 } });
    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'No student found with pending dues.' });
    }

    const Student = require('../models/Student');
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const record of records) {
      // Safeguard check for duplicate reminder in last 24h - disabled for testing phase
      if (false && record.lastReminderSent && !force) {
        const hoursSinceLast = (new Date() - new Date(record.lastReminderSent)) / (1000 * 60 * 60);
        if (hoursSinceLast < 24) {
          results.push({
            studentId: record.studentId,
            name: record.name,
            skipped: true,
            message: 'Skipped - Reminder sent in last 24h'
          });
          continue;
        }
      }

      const student = await Student.findOne({ studentId: record.studentId });
      if (!student) {
        results.push({
          studentId: record.studentId,
          name: record.name,
          success: false,
          error: 'Registered student details not found'
        });
        failedCount++;
        continue;
      }

      try {
        const result = await NotificationService.sendNotification({
          student,
          type: 'fee_reminder',
          data: {
            dueAmount: record.dueAmount,
            dueDate: record.dueDate
          },
          initiatedBy: adminId || (req.user ? req.user.id : null)
        });

        results.push({
          studentId: record.studentId,
          name: record.name,
          success: result.success,
          email: result.email,
          sms: result.sms
        });

        if (result.success) successCount++;
        else failedCount++;
      } catch (err) {
        results.push({
          studentId: record.studentId,
          name: record.name,
          success: false,
          error: err.message
        });
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk reminders processed. Sent: ${successCount}, Failed: ${failedCount}, Skipped: ${records.length - successCount - failedCount}`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/accounts/notifications/logs', async (req, res) => {
  try {
    const logs = await NotificationLog.find({})
      .sort({ timestamp: -1 })
      .populate('initiatedBy', 'name email role');
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student Fee Routes
router.get('/student/fee-record/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    await syncFeeRecords();
    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Student fee record not found' });
    }
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/student/pay-fee', async (req, res) => {
  try {
    const { studentId, category, amount, method, referenceNumber, status } = req.body;
    
    if (!studentId || !category || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Student fee record not found' });
    }

    const payAmt = Number(amount);
    if (payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${today.getDate()} ${months[today.getMonth()]}`;
    
    let hours = today.getHours();
    const minutes = today.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    const initialStatus = status || 'Under Verification';

    // Update fee record calculations immediately ONLY if status is explicitly 'Paid' or 'completed'
    if (initialStatus === 'Paid' || initialStatus === 'completed') {
      record.paidAmount += payAmt;
      record.dueAmount = Math.max(0, record.totalFee - record.paidAmount);

      if (record.dueAmount === 0) {
        record.feeStatus = 'paid';
      } else if (record.paidAmount > 0) {
        record.feeStatus = 'partial';
      } else {
        record.feeStatus = 'pending';
      }

      record.lastPaymentDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      await record.save();
    }

    // Create unique TXN ID
    const txnId = `TXN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    const txn = new Transaction({
      id: txnId,
      studentName: record.name,
      rollNo: record.rollNo,
      program: record.program,
      type: 'payment',
      feeCategory: category,
      amount: payAmt,
      method: method,
      date: formattedDate,
      time: strTime,
      status: initialStatus,
      referenceNumber: referenceNumber || '-'
    });
    await txn.save();

    res.json({
      success: true,
      message: 'Payment submitted successfully',
      transaction: txn,
      feeRecord: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Route to Approve/Reject/Update payment status
router.put('/accounts/transactions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Paid' or 'Rejected'

    if (!['Paid', 'Rejected', 'Under Verification', 'completed', 'processing'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status value' });
    }

    const txn = await Transaction.findOne({ id: id });
    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const prevStatus = txn.status;
    txn.status = status;
    await txn.save();

    // If transitioned to Paid/completed, update FeeRecord
    if ((status === 'Paid' || status === 'completed') && prevStatus !== 'Paid' && prevStatus !== 'completed') {
      const record = await FeeRecord.findOne({ studentId: txn.rollNo });
      if (record) {
        record.paidAmount += txn.amount;
        record.dueAmount = Math.max(0, record.totalFee - record.paidAmount);

        if (record.dueAmount === 0) {
          record.feeStatus = 'paid';
        } else if (record.paidAmount > 0) {
          record.feeStatus = 'partial';
        } else {
          record.feeStatus = 'pending';
        }

        const today = new Date();
        record.lastPaymentDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        await record.save();
      }
    }

    res.json({
      success: true,
      message: `Transaction status successfully updated to ${status}`,
      transaction: txn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic route to get a student's own accounts ledger
router.get('/accounts/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    await syncFeeRecords();
    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Student fee record not found' });
    }
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Route to Apply/Override Scholarship
router.post('/accounts/student/:studentId/scholarship', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, amount, type, status } = req.body;

    await syncFeeRecords();
    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const scholAmt = Number(amount) || 0;

    // Apply manual scholarship
    if (name || scholAmt > 0) {
      record.scholarship = {
        id: `MANUAL_${Date.now()}`,
        name: name || 'Custom Scholarship',
        amount: scholAmt,
        type: type || 'other',
        status: status || 'applied'
      };
    } else {
      // Clear manual scholarship (so it falls back to auto GPA on next sync)
      record.scholarship = {
        id: '',
        name: '',
        amount: 0,
        type: '',
        status: ''
      };
    }

    // Recalculate totalFee, dueAmount and status
    const baseFee = record.academicFee + record.hostelFee + record.messFee + record.otherCharges;
    record.totalFee = baseFee - record.scholarship.amount;
    record.dueAmount = Math.max(0, record.totalFee - record.paidAmount);

    if (record.dueAmount === 0) {
      record.feeStatus = 'paid';
    } else if (record.paidAmount > 0) {
      record.feeStatus = 'partial';
    } else {
      record.feeStatus = 'pending';
    }

    await record.save();
    res.json({ success: true, message: 'Scholarship applied successfully', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic route to get a student's own payment transaction history
router.get('/accounts/student/:studentId/payments', async (req, res) => {
  try {
    const { studentId } = req.params;
    const transactions = await Transaction.find({ rollNo: studentId }).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

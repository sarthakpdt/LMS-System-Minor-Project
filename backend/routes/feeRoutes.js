const express = require('express');
const router = express.Router();
const FeeRecord = require('../models/FeeRecord');
const Transaction = require('../models/Transaction');

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
      if (!record) {
        const program = student.department === 'CS' ? 'B.Tech (CSE)' : 
                        student.department === 'IT' ? 'B.Tech (IT)' : 
                        student.department === 'MBA' ? 'MBA' : 'Other';
        const semester = Number(student.semester) || 1;
        
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
          totalFee: 159000,
          paidAmount: 0,
          dueAmount: 159000,
          feeStatus: 'pending',
          lastPaymentDate: '-'
        });
        try {
          await record.save();
        } catch (saveErr) {
          if (saveErr.code !== 11000) {
            throw saveErr;
          }
        }
      }
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
    const { studentId } = req.body;
    const record = await FeeRecord.findOne({ studentId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    // Mock sending notification/reminder
    res.json({ 
      success: true, 
      message: `Reminder sent successfully to ${record.name} (${record.rollNo})` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student Fee Routes
router.get('/student/fee-record/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    let record = await FeeRecord.findOne({ studentId });
    
    // If not found, let's create a dynamic default record for this student based on their model info
    if (!record) {
      const User = require('../models/User'); // Or Student
      const Student = require('../models/Student');
      const studentObj = await Student.findOne({ studentId });
      
      if (studentObj) {
        const program = studentObj.department === 'CS' ? 'B.Tech (CSE)' : 
                        studentObj.department === 'IT' ? 'B.Tech (IT)' : 
                        studentObj.department === 'MBA' ? 'MBA' : 'Other';
        const semester = Number(studentObj.semester) || 1;
        
        record = new FeeRecord({
          studentId: studentObj.studentId,
          rollNo: studentObj.studentId,
          name: studentObj.name,
          program: program,
          semester: semester,
          paymentPlan: 'semester',
          academicFee: 92500,
          hostelFee: 36000,
          messFee: 24000,
          otherCharges: 6500,
          totalFee: 159000,
          paidAmount: 0,
          dueAmount: 159000,
          feeStatus: 'pending',
          lastPaymentDate: '-'
        });
        await record.save();
      } else {
        return res.status(404).json({ success: false, message: 'Student details not found' });
      }
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
    let record = await FeeRecord.findOne({ studentId });
    
    if (!record) {
      const Student = require('../models/Student');
      const studentObj = await Student.findOne({ studentId });
      
      if (studentObj) {
        const program = studentObj.department === 'CS' ? 'B.Tech (CSE)' : 
                        studentObj.department === 'IT' ? 'B.Tech (IT)' : 
                        studentObj.department === 'MBA' ? 'MBA' : 'Other';
        const semester = Number(studentObj.semester) || 1;
        
        record = new FeeRecord({
          studentId: studentObj.studentId,
          rollNo: studentObj.studentId,
          name: studentObj.name,
          program: program,
          semester: semester,
          paymentPlan: 'semester',
          academicFee: 92500,
          hostelFee: 36000,
          messFee: 24000,
          otherCharges: 6500,
          totalFee: 159000,
          paidAmount: 0,
          dueAmount: 159000,
          feeStatus: 'pending',
          lastPaymentDate: '-'
        });
        await record.save();
      } else {
        return res.status(404).json({ success: false, message: 'Student details not found' });
      }
    }
    
    res.json({ success: true, record });
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

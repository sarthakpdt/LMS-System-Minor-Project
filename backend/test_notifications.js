const dotenv = require('dotenv');
const path = require('path');

// Configure environment variables first
dotenv.config({ path: path.join(__dirname, '.env') });

// Hijack the Accounts DB URI to use the LMS DB URI for local testing
process.env.ACCOUNTS_MONGO_URI = process.env.MONGO_URI;

const mongoose = require('mongoose');
const { accountsConnection } = require('./lib/mongodb');
const Student = require('./models/Student');
const FeeRecord = require('./models/FeeRecord');
const NotificationLog = require('./models/NotificationLog');
const NotificationService = require('./services/NotificationService');

async function run() {
  try {
    console.log('Connecting to databases...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to LMS Primary Database.');

    // Ensure accountsConnection is ready
    await new Promise((resolve) => {
      if (accountsConnection.readyState === 1) resolve();
      else accountsConnection.once('connected', resolve);
    });
    console.log('✅ Connected to Accounts Database (redirected to primary for test).');

    // 1. Find or create a test student in LMS DB
    let testStudent = await Student.findOne({ studentId: 'TEST_STU_999' });
    if (testStudent) {
      await Student.deleteOne({ studentId: 'TEST_STU_999' });
    }
    console.log('Creating test student...');
    testStudent = new Student({
      name: 'Test Defaulter Student',
      email: 'defaulter@example.com',
      password: 'password123',
      phone: '9876543210',
      studentId: 'TEST_STU_999',
      department: 'CS',
      semester: '5',
      approvalStatus: 'approved'
    });
    await testStudent.save();

    // 2. Find or create a corresponding FeeRecord
    // (Note: we delete first so that we register the model on the primary connection cleanly)
    await FeeRecord.deleteOne({ studentId: 'TEST_STU_999' });
    console.log('Creating test FeeRecord...');
    const testFeeRecord = new FeeRecord({
      studentId: 'TEST_STU_999',
      rollNo: 'TEST_STU_999',
      name: testStudent.name,
      program: 'B.Tech (CSE)',
      semester: 5,
      paymentPlan: 'semester',
      academicFee: 100000,
      paidAmount: 20000,
      dueAmount: 80000,
      feeStatus: 'partial',
      totalFee: 80000,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });
    await testFeeRecord.save();

    console.log('\n--- Test 1: Trigger NotificationService for student ---');
    const report = await NotificationService.sendNotification({
      student: testStudent,
      type: 'fee_reminder',
      data: {
        dueAmount: testFeeRecord.dueAmount,
        dueDate: testFeeRecord.dueDate
      }
    });
    console.log('Dispatch report result:', JSON.stringify(report, null, 2));

    // Verify logs were written
    const logs = await NotificationLog.find({ studentId: 'TEST_STU_999' }).sort({ timestamp: -1 });
    console.log(`\n✅ Created ${logs.length} database logs in NotificationLog:`);
    logs.forEach(log => {
      console.log(`- Channel: ${log.deliveryChannel} | Status: ${log.deliveryStatus} | Time: ${log.timestamp.toLocaleTimeString()}`);
    });

    // Check lastReminderSent field on FeeRecord
    const updatedRecord = await FeeRecord.findOne({ studentId: 'TEST_STU_999' });
    console.log(`\nFeeRecord lastReminderSent updated: ${updatedRecord.lastReminderSent}`);

    console.log('\n--- Cleanup: Removing test data... ---');
    await Student.deleteOne({ studentId: 'TEST_STU_999' });
    await FeeRecord.deleteOne({ studentId: 'TEST_STU_999' });
    await NotificationLog.deleteMany({ studentId: 'TEST_STU_999' });
    console.log('Cleanup completed successfully.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Close connections
    await mongoose.disconnect();
    await accountsConnection.close();
    console.log('Disconnected from databases.');
  }
}

run();

const EmailService = require('./EmailService');
const SMSService = require('./SMSService');
const NotificationLog = require('../models/NotificationLog');
const FeeRecord = require('../models/FeeRecord');

class NotificationService {
  /**
   * Orchestrates sending notifications across both channels independently
   * @param {Object} options
   * @param {Object} options.student - The Mongoose student document
   * @param {String} options.type - Notification template type enum (e.g. 'fee_reminder')
   * @param {Object} options.data - Additional key-values for templates (e.g. dueAmount, dueDate)
   * @param {String} [options.initiatedBy] - Administrator Mongoose Object ID
   * @returns {Promise<Object>} Summary report of the dispatch status per channel
   */
  static async sendNotification({ student, type, data, initiatedBy }) {
    // 1. Generate text templates for the notification type
    const templates = this.generateTemplates(type, student, data);

    // 2. Dispatch Email and SMS concurrently and independently
    const emailPromise = EmailService.sendEmail({
      to: student.email,
      subject: templates.emailSubject,
      text: templates.emailText,
      html: templates.emailHtml
    });

    const smsPromise = SMSService.sendSMS({
      to: student.phone,
      message: templates.smsText
    });

    const [emailResult, smsResult] = await Promise.allSettled([emailPromise, smsPromise]);

    const isEmailOk = emailResult.status === 'fulfilled' && emailResult.value.success;
    const isSmsOk = smsResult.status === 'fulfilled' && smsResult.value.success;

    const emailError = emailResult.status === 'rejected' 
      ? emailResult.reason?.message 
      : (!isEmailOk ? emailResult.value?.error : null);

    const smsError = smsResult.status === 'rejected' 
      ? smsResult.reason?.message 
      : (!isSmsOk ? smsResult.value?.error : null);

    // 3. Persist log details for audit
    // Email Log
    const emailLog = new NotificationLog({
      studentId: student.studentId,
      studentName: student.name,
      student: student._id,
      notificationType: type,
      deliveryChannel: 'Email',
      messageContent: `Subject: ${templates.emailSubject}\n\n${templates.emailText}`,
      deliveryStatus: isEmailOk ? 'Success' : 'Failed',
      errorDetails: emailError,
      initiatedBy: initiatedBy || null
    });
    await emailLog.save();

    // SMS Log
    const smsLog = new NotificationLog({
      studentId: student.studentId,
      studentName: student.name,
      student: student._id,
      notificationType: type,
      deliveryChannel: 'SMS',
      messageContent: templates.smsText,
      deliveryStatus: isSmsOk ? 'Success' : 'Failed',
      errorDetails: smsError,
      initiatedBy: initiatedBy || null
    });
    await smsLog.save();

    // 4. Update the student fee ledger state if this is a fee reminder
    if (type === 'fee_reminder' && (isEmailOk || isSmsOk)) {
      await FeeRecord.updateOne(
        { studentId: student.studentId },
        { $set: { lastReminderSent: new Date() } }
      );
    }

    return {
      success: isEmailOk || isSmsOk, // Succeeded if at least one channel delivered
      email: {
        success: isEmailOk,
        provider: isEmailOk ? emailResult.value.provider : null,
        error: emailError
      },
      sms: {
        success: isSmsOk,
        provider: isSmsOk ? smsResult.value.provider : null,
        error: smsError
      }
    };
  }

  /**
   * Template Generation System
   * Easily expandable to other student notifications (confirmations, rosters, etc.)
   */
  static generateTemplates(type, student, data) {
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(data.dueAmount || 0);

    const formattedDate = data.dueDate 
      ? new Date(data.dueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'N/A';

    switch (type) {
      case 'fee_reminder':
        return {
          emailSubject: `⚠️ Urgent: Pending Term Fee Reminder - EduTrack LMS`,
          emailText: `Dear ${student.name},\n\nThis is a notification regarding your pending semester balance of ${formattedAmount} which is due on ${formattedDate}.\n\nPlease clear the balance by logging into the student ERP portal to avoid late fines or academic registration holds.\n\nRegards,\nFinance Division\nEduTrack Engineering College`,
          emailHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="background-color: #4f46e5; padding: 20px; color: white; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">Fee Payment Pending Notification</h2>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p>Dear <strong>${student.name}</strong> (ID: ${student.studentId}),</p>
                <p>This is to remind you that an outstanding balance of <strong style="color: #dc2626; font-size: 16px;">${formattedAmount}</strong> is pending in your student ledger account.</p>
                <p>Please clear this balance on or before <strong>${formattedDate}</strong> to ensure uninterrupted access to academic resources, attendance registry, and examinations.</p>
                <div style="margin: 24px 0; text-align: center;">
                  <a href="http://localhost:5173/fees" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Fees Online</a>
                </div>
                <p style="font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  If you have already paid or submitted a transaction for verification, please disregard this automated notification. For queries, contact accounts@edutrack.com.
                </p>
              </div>
            </div>
          `,
          smsText: `Dear ${student.name}, your pending fee of ${formattedAmount} is due by ${formattedDate}. Please log in to your EduTrack portal to clear it. - EduTrack Accounts`
        };

      case 'fee_payment_confirmation':
        return {
          emailSubject: `✅ Fee Payment Confirmation - EduTrack LMS`,
          emailText: `Dear ${student.name},\n\nWe have successfully verified and recorded your fee payment of ${formattedAmount}. Your updated outstanding balance is ${data.remainingBalance || 0}.\n\nThank you for the prompt clearance of your dues.\n\nRegards,\nFinance Division\nEduTrack LMS`,
          emailHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #10b981; padding: 20px; color: white; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">Payment Received & Verified</h2>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p>Dear <strong>${student.name}</strong>,</p>
                <p>We are pleased to inform you that your payment of <strong>${formattedAmount}</strong> has been successfully verified.</p>
                <p>Updated outstanding balance: <strong>${data.remainingBalance || '0'}</strong></p>
              </div>
            </div>
          `,
          smsText: `Dear ${student.name}, your payment of ${formattedAmount} has been verified and updated. - EduTrack Accounts`
        };

      default:
        return {
          emailSubject: `EduTrack LMS Notification`,
          emailText: `Dear ${student.name},\n\nYou have received a new update on your dashboard. Please log in to view details.\n\nRegards,\nLMS Admin`,
          emailHtml: `<p>Dear ${student.name}, you have a new update. Please log in to your dashboard.</p>`,
          smsText: `Dear ${student.name}, you have a new dashboard update. Please log in. - EduTrack`
        };
    }
  }
}

module.exports = NotificationService;

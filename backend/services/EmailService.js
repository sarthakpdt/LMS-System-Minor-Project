const nodemailer = require('nodemailer');

class EmailService {
  /**
   * Send email to recipient
   * @param {Object} options
   * @param {String} options.to - Recipient email address
   * @param {String} options.subject - Email subject
   * @param {String} options.text - Plain text content
   * @param {String} options.html - HTML rich content
   * @returns {Promise<Object>} Status report
   */
  static async sendEmail({ to, subject, text, html }) {
    // Read SMTP configuration from environment
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'EduTrack LMS <no-reply@edutrack.com>';

    // Fallback if SMTP is not configured
    if (!user || !pass) {
      console.warn('⚠️ SMTP credentials not found in environment. Simulating email transmission.');
      console.log(`
=========================================
[EMAIL SIMULATION LOG]
To: ${to}
Subject: ${subject}
Text: ${text}
=========================================
      `);
      return { 
        success: true, 
        provider: 'simulation', 
        messageId: `sim-email-${Date.now()}` 
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });

      return { 
        success: true, 
        provider: 'nodemailer', 
        messageId: info.messageId 
      };
    } catch (error) {
      console.error('❌ Email Service Error:', error);
      return { 
        success: false, 
        provider: 'nodemailer', 
        error: error.message 
      };
    }
  }
}

module.exports = EmailService;

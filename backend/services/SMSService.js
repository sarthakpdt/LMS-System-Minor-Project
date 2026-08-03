const twilio = require('twilio');

class SMSService {
  /**
   * Send SMS to recipient
   * @param {Object} options
   * @param {String} options.to - Recipient phone number
   * @param {String} options.message - Message body text
   * @returns {Promise<Object>} Status report
   */
  static async sendSMS({ to, message }) {
    // Read SMS Gateway credentials from environment
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91SenderId = process.env.MSG91_SENDER_ID;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

    // Normalize phone number (prepending Indian +91 if length is 10 and no code exists)
    let formattedPhone = to.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = '+' + formattedPhone;
      }
    }

    // 1. Try MSG91 gateway if configured
    if (msg91AuthKey) {
      try {
        const axios = require('axios'); // dynamically load/require if needed
        const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
          template_id: msg91TemplateId,
          sender: msg91SenderId,
          short_url: '1',
          recipients: [
            {
              mobiles: formattedPhone.replace('+', ''), // MSG91 expects no "+" prefix
              message: message
            }
          ]
        }, {
          headers: {
            'authkey': msg91AuthKey,
            'content-type': 'application/json'
          }
        });

        if (response.data && (response.data.type === 'success' || response.data.status === 'success')) {
          return { 
            success: true, 
            provider: 'msg91', 
            response: response.data 
          };
        } else {
          throw new Error(`MSG91 Error: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        console.error('❌ MSG91 SMS Service Error:', error);
        return { 
          success: false, 
          provider: 'msg91', 
          error: error.message 
        };
      }
    }

    // 2. Try Twilio gateway if configured
    if (twilioSid && twilioAuthToken) {
      try {
        const client = twilio(twilioSid, twilioAuthToken);
        const result = await client.messages.create({
          body: message,
          from: twilioFrom,
          to: formattedPhone
        });

        return { 
          success: true, 
          provider: 'twilio', 
          messageSid: result.sid 
        };
      } catch (error) {
        console.error('❌ Twilio SMS Service Error:', error);
        return { 
          success: false, 
          provider: 'twilio', 
          error: error.message 
        };
      }
    }

    // 3. Fallback to simulator logger if no SMS gateway credentials configured
    console.warn('⚠️ SMS credentials not found in environment. Simulating SMS transmission.');
    console.log(`
=========================================
[SMS SIMULATION LOG]
To: ${formattedPhone}
Message: ${message}
=========================================
    `);
    return { 
      success: true, 
      provider: 'simulation', 
      messageId: `sim-sms-${Date.now()}` 
    };
  }
}

module.exports = SMSService;

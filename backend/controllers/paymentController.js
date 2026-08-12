const FeeRecord = require('../models/FeeRecord');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const razorpay = require('../services/RazorpayService');
const crypto = require('crypto');

exports.createOrder = async (req, res) => {
  console.log("🔥 CREATE ORDER CALLED");
  console.log("[PAYMENT] Request body:", req.body);

  try {
    const { studentId, amount, feeCategory } = req.body;

    // 1. Validate request
    if (!studentId || !amount || !feeCategory) {
      console.log("[PAYMENT] Missing order details");

      return res.status(400).json({
        success: false,
        message: "Missing order details"
      });
    }

    console.log("[PAYMENT] studentId:", studentId);
    console.log("[PAYMENT] amount:", amount);
    console.log("[PAYMENT] feeCategory:", feeCategory);

    // 2. Find student's fee record
    const feeRecord = await FeeRecord.findOne({ studentId });

    console.log(
      "[PAYMENT] Fee record found:",
      !!feeRecord
    );

    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        message: `Fee record not found for studentId: ${studentId}`
      });
    }

    // 3. Validate amount
    const payAmt = Number(amount);

    if (!Number.isFinite(payAmt) || payAmt <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero"
      });
    }

    console.log("[PAYMENT] Creating Razorpay order...");

    // 4. Create Razorpay order
    const options = {
      amount: Math.round(payAmt * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    console.log(
      "[PAYMENT] Razorpay order created:",
      order.id
    );

    // 5. Save payment record
    const payment = new Payment({
      orderId: order.id,
      studentId: feeRecord.studentId,
      name: feeRecord.name,
      rollNo: feeRecord.rollNo,
      program: feeRecord.program,
      feeCategory: feeCategory,
      amount: payAmt,
      status: "created"
    });

    console.log("[PAYMENT] Saving Payment document...");

    await payment.save();

    console.log(
      "[PAYMENT] Payment document saved:",
      payment._id
    );

    // 6. Return order to frontend
    return res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
      payment
    });

  } catch (error) {
    console.error("❌ CREATE ORDER FAILED");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        "Payment order creation failed"
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing verification fields' });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find the payment document
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order' });
    }

    // Update payment document status
    payment.status = 'success';
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.updatedAt = new Date();
    await payment.save();

    // Update Student Fee Record Dues and Paid details immediately
    const feeRecord = await FeeRecord.findOne({ studentId: payment.studentId });
    if (feeRecord) {
      feeRecord.paidAmount += payment.amount;
      feeRecord.dueAmount = Math.max(0, feeRecord.totalFee - feeRecord.paidAmount);

      if (feeRecord.dueAmount === 0) {
        feeRecord.feeStatus = 'paid';
      } else if (feeRecord.paidAmount > 0) {
        feeRecord.feeStatus = 'partial';
      }

      const today = new Date();
      feeRecord.lastPaymentDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      await feeRecord.save();
    }

    // Create a corresponding Transaction ledger entry immediately with status 'Paid'
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${today.getDate()} ${months[today.getMonth()]}`;

    let hours = today.getHours();
    const minutes = today.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    const txnId = `TXN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${String(Math.floor(1000 + Math.random() * 9000))}`;

    const txn = new Transaction({
      id: txnId,
      studentName: payment.name,
      rollNo: payment.rollNo,
      program: payment.program,
      type: 'payment',
      feeCategory: payment.feeCategory,
      amount: payment.amount,
      method: 'Card', // or generic online gateway
      date: formattedDate,
      time: strTime,
      status: 'Paid',
      referenceNumber: razorpay_payment_id
    });
    await txn.save();

    res.json({
      success: true,
      message: 'Payment verified successfully and accounts updated.',
      transaction: txn,
      feeRecord
    });
  } catch (error) {
    console.error('Razorpay Verify Payment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReceiptDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Look up transaction by referenceNumber (Razorpay payment ID/UTR) or transaction ID
    let txn = await Transaction.findOne({ referenceNumber: paymentId });
    if (!txn) {
      txn = await Transaction.findOne({ id: paymentId });
    }

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction receipt record not found.' });
    }

    res.json({
      success: true,
      transaction: txn
    });
  } catch (error) {
    console.error('❌ Razorpay Create Order Error:', error);
    console.error('❌ Razorpay Error Details:', error?.error || error?.description || error?.message);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.description ||
        error?.message ||
        'Razorpay order creation failed'
    });
  }
}


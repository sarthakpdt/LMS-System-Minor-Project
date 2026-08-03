const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getReceiptDetails } = require('../controllers/paymentController');

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/receipt/:paymentId', getReceiptDetails);

module.exports = router;

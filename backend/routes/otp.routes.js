const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../utils/emailOtp.service');

// @desc    Send OTP to email
// @route   POST /api/otp/send-email
// @access  Public
router.post('/send-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const success = await sendOtp(email);

    if (success) {
        res.status(200).json({ message: 'OTP sent successfully' });
    } else {
        res.status(500).json({ message: 'Failed to send OTP (Check server logs)' });
    }
});

// @desc    Verify OTP
// @route   POST /api/otp/verify-email
// @access  Public
router.post('/verify-email', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const result = verifyOtp(email, otp);

    if (result === 'success') {
        res.status(200).json({ message: 'Email verified successfully' });
    } else if (result === 'expired') {
        res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

module.exports = router;

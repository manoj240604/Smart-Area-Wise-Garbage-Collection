const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/*
================================================
IN-MEMORY OTP STORE
Key: email
Value: { otp, expiresAt }
================================================
*/
const otpStore = new Map();

/*
================================================
VALIDATE EMAIL CONFIGURATION
================================================
*/
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠ EMAIL_USER or EMAIL_PASS not configured in .env");
}

/*
================================================
CONFIGURE NODEMAILER TRANSPORTER
================================================
*/
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/*
================================================
GENERATE 6-DIGIT OTP
================================================
*/
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/*
================================================
SEND OTP FUNCTION
================================================
*/
const sendOtp = async (email) => {
    try {
        const otp = generateOtp();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP in memory
        otpStore.set(email, { otp, expiresAt });

        // Development Mode — Log OTP in terminal
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 DEV OTP for ${email}: ${otp}`);
        }

        const mailOptions = {
            from: `"SmartBin Verification" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'SmartBin - Email Verification OTP',
            html: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: linear-gradient(90deg, #10b981, #4f46e5); padding: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">SmartBin</h1>
      <p style="color: #e0f2fe; margin: 5px 0 0; font-size: 14px;">
        Smart Area-Wise Garbage Collection System
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #374151;">Dear User,</p>

      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Thank you for registering with <strong>SmartBin</strong>.
        To complete your account verification, please use the One-Time Password (OTP) provided below:
      </p>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
        <h1 style="color: #4f46e5; letter-spacing: 6px; margin: 0; font-size: 28px;">
          ${otp}
        </h1>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        This OTP is valid for <strong>5 minutes</strong>.
        For security reasons, please do not share this code with anyone.
      </p>

      <p style="font-size: 14px; color: #6b7280;">
        If you did not request this verification, please ignore this email.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="font-size: 13px; color: #6b7280;">
        Need assistance? Contact us at 
        <a href="mailto:support@smartbin.com" style="color: #4f46e5; text-decoration: none;">
          support@smartbin.com
        </a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        © ${new Date().getFullYear()} Smart Area-Wise Garbage Collection System
      </p>
      <p style="font-size: 11px; color: #d1d5db; margin-top: 5px;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>

  </div>
</div>
`
        };

        await transporter.sendMail(mailOptions);

        console.log(`✅ OTP sent successfully to ${email}`);
        return true;

    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        return false;
    }
};

/*
================================================
VERIFY OTP FUNCTION
================================================
Returns:
- 'success'
- 'invalid'
- 'expired'
================================================
*/
const verifyOtp = (email, enteredOtp) => {
    if (!otpStore.has(email)) {
        return 'invalid';
    }

    const record = otpStore.get(email);

    // Check expiry
    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return 'expired';
    }

    // Check OTP match
    if (record.otp === enteredOtp) {
        otpStore.delete(email); // Remove after success
        return 'success';
    }

    return 'invalid';
};

module.exports = { sendOtp, verifyOtp };


const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: `"ZEIT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your ZEIT Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to ZEIT!</h2>
        <p>Your email verification OTP is:</p>
        <h1 style="letter-spacing: 8px; color: #2563eb;">
          ${otp}
        </h1>
        <p>This OTP expires in 5 minutes.</p>
        <p>Do not share this OTP with anyone.</p>
        <p>Thank you,<br/>ZEIT Team</p>
      </div>
    `,
  });
}

module.exports = sendOTPEmail;

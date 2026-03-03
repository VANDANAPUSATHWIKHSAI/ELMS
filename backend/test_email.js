require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log("Starting test email send...");
transporter.sendMail({
  from: `"KMIT ELMS Admin" <${process.env.EMAIL_USER}>`,
  to: 'shyambharjee@gmail.com',
  subject: 'KMIT ELMS - Test Email',
  text: 'If you receive this, the email service is working 100%!'
}, (err, info) => {
  if (err) {
    console.error('❌ EMAIL ERROR:', err.message);
    if (err.response) console.error('Response:', err.response);
  } else {
    console.log('✅ EMAIL SUCCESS:', info.response);
  }
  process.exit();
});

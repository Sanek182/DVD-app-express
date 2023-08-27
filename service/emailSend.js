const nodemailer = require('nodemailer');

function sendPasswordResetEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.USER_MAILTRAP,
      pass: process.env.MAIL_MAILTRAP,
    },
  });

  const mailOptions = {
    to: email,
    from: 'noreply@alexstore.com',
    subject: 'Create New Password',
    text: `Hi, dear user! You got this letter because you want to reset the password for your account.\n\n
      Please paste this link into your browser to complete the password change process:\n\n
      http://localhost:3000/auth/reset-password/${token}\n\ `,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Email could not be sent.');
    }
  });
}

module.exports = {
  sendPasswordResetEmail,
};

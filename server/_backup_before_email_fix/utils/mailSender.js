
const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"StudyNotion" <${process.env.MAIL_USER}>`,
    to: email,
    subject: title,
    html: body,
  });

  console.log("Email sent:", info.messageId);
  return info;
};

module.exports = mailSender;


const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  let transporter;

  try {
    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host || !user || !pass) {
      throw new Error("Missing MAIL_HOST, MAIL_USER, or MAIL_PASS environment variable");
    }

    transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });

    const info = await transporter.sendMail({
      from: `"StudyNotion" <${user}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email accepted by SMTP server:", info.accepted);
    console.log("Email rejected by SMTP server:", info.rejected);
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email sending failed:", error.code || "", error.message);
    throw error;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

module.exports = mailSender;

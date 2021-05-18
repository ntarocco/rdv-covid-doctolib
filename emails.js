const nodemailer = require("nodemailer");
const { config } = require("./utils");

const sendEmail = async (subject, body) => {
  if (!config.nodemailer.enabled) {
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.nodemailer.user,
      pass: config.nodemailer.password,
    },
  });

  const mailOptions = {
    from: config.nodemailer.from,
    to: config.nodemailer.to,
    subject: subject,
    text: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return {
      success: true,
      payload: info,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      payload: error,
    };
  }
};

exports.sendEmail = sendEmail;

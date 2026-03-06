const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: "smtp.titan.email",
  port: 465,
  secure: true,
  auth: {
    user: "care@dlm.cash",
    pass: "Zaq@12345"
  },
  debug: true,
  logger: true
});
transporter.verify(function(error, success) {
  if (error) {
    console.log("FAILED_VERIFY:", error);
  } else {
    console.log("SUCCESS_VERIFY");
  }
});

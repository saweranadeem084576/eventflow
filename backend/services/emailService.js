const nodemailer = require("nodemailer");
const config = require("../config");

let transporter;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.password) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.password },
    });
  }
  return transporter;
}

exports.sendPasswordReset = async (email, token) => {
  const resetUrl = `${config.passwordResetUrl}?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `[emailService] Password reset email service is not configured. Reset URL for ${email}: ${resetUrl}`,
    );
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "Reset your EventFlow password",
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in 15 minutes.`,
    html: `<p>Reset your EventFlow password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 15 minutes.</p>`,
  });
};

import transporter from "../utils/email.js";
import logger from "../utils/logger.js";

// function to send the verification email
const sendVerificationEmail = async (email, verificationLink) => {
  try {
    await transporter.sendMail({
      from: `"Auth-System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <h2>Email Verification</h2>
        <p>Thank you for registering.</p>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationLink}" target="_blank">
          Verify Email
        </a>
        <p>This link will expire soon.</p>
      `,
    });
  } catch (error) {
    logger.error("error sending verification email:", error);
    throw new Error("email could not be sent");
  }
};

// function to send the password reset email
const sendPasswordResetEmail = async (email, passwordResetLink) => {
  try {
    await transporter.sendMail({
      from: `"Auth-System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it:</p>
        <a href="${passwordResetLink}" target="_blank">
          Reset Password
        </a>
        <p>If you did not request this, ignore this email.</p>
        `,
    });
  } catch (err) {
    logger.error("error sending password reset email", err);
    throw new Error("email could not be sent");
  }
};

// function to send the welcome email
const sendWelcomeEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Our Platform 🎉",
      html: `
        <h2>Welcome!</h2>
        <p>Your account has been successfully created.</p>
        <p>We're excited to have you on board.</p>
        <p>Feel free to explore and let us know if you have any questions. Also verify the email address associated with your account for seamless experience.</p>
      `,
    });
  } catch (error) {
    logger.error("Error sending welcome email:", error);
    throw new Error("Email could not be sent");
  }
};

export { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail }; // exporting the functions

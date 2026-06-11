import { enqueueEmailJob } from "../queues/email.queue.js";

// function to queue verification email
export async function queueVerificationEmail(email, verificationLink) {
  return await enqueueEmailJob("verification-email", {
    email,
    verificationLink,
  });
}

// function to queue welcome email
export async function queueWelcomeEmail(email) {
  return await enqueueEmailJob("welcome-email", { email });
}

// function to queue password reset email
export async function queuePasswordResetEmail(email, passwordResetLink) {
  return await enqueueEmailJob("password-reset-email", {
    email,
    passwordResetLink,
  });
}

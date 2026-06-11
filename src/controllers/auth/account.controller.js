import crypto from "node:crypto";
import User from "../../models/user.model.js";
import {
  hashToken,
  verifyToken,
} from "../../services/token.service.js";
import {
  queueWelcomeEmail,
  queueVerificationEmail,
} from "../../services/email.queue.service.js";
import { createHttpError, recordAudit } from "./auth.helpers.js";

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "invalid credentials" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ message: "user already exists" });

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenHash = await hashToken(emailVerificationToken);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await User.create({
      email: normalizedEmail,
      password,
      role: "user",
      emailVerificationToken: emailVerificationTokenHash,
      emailVerificationTokenExpiry: tokenExpiry,
      emailVerified: false,
    });

    const baseURL = process.env.CLIENT_URL;
    if (!baseURL) {
      return next(createHttpError("CLIENT_URL not configured", 500));
    }

    const verificationLink = `${baseURL}/api/v1/auth/verify-email?token=${encodeURIComponent(
      emailVerificationToken,
    )}`;

    await queueVerificationEmail(newUser.email, verificationLink);
    await recordAudit({ user: newUser._id, event: "register", req });

    return res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      userId: newUser._id,
    });
  } catch (err) {
    return next(err);
  }
}

export async function welcomeEmail(req, res, next) {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.emailVerified) {
      return res.status(403).json({
        message:
          "Email not verified. Please verify your email to receive welcome email.",
      });
    }

    await queueWelcomeEmail(user.email);
    return res.status(200).json({ message: "Welcome email sent successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const users = await User.find({
      emailVerificationToken: { $exists: true, $ne: null },
      emailVerificationTokenExpiry: { $gt: new Date() },
    });

    let user = null;
    for (const candidate of users) {
      const isMatch = await verifyToken(token, candidate.emailVerificationToken);
      if (isMatch) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    await queueWelcomeEmail(user.email);
    await recordAudit({ user: user._id, event: "verify_email", req });

    return res.status(200).json({
      message: "Email verified successfully! You can now login.",
    });
  } catch (err) {
    return next(err);
  }
}

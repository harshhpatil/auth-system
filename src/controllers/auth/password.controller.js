import crypto from "node:crypto";
import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";
import { passwordResetToken } from "../../services/token.service.js";
import { queuePasswordResetEmail } from "../../services/email.queue.service.js";
import { authCookieOptions, createHttpError, recordAudit } from "./auth.helpers.js";

export async function changePassword(req, res, next) {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "current and new password are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "current password is incorrect" });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "new password must be different from current password" });
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await Session.updateMany({ user: user._id, revoked: false }, { revoked: true });
    res.clearCookie("accessToken", authCookieOptions);
    res.clearCookie("refreshToken", authCookieOptions);
    await user.save();

    await recordAudit({ user: user._id, event: "change_password", req });

    return res.status(200).json({ message: "password changed successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const successMessage = "If an account with that email exists, a password reset link has been sent.";

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(200).json({ message: successMessage });

    const { resetToken, hashedResetToken } = passwordResetToken();
    const baseURL = process.env.FRONTEND_URL || process.env.CLIENT_URL;
    if (!baseURL) {
      return next(createHttpError("reset URL not configured", 500));
    }

    const resetLink = `${baseURL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    user.passwordResetToken = hashedResetToken;
    user.passwordResetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await user.save();

    await queuePasswordResetEmail(user.email, resetLink);
    await recordAudit({ user: user._id, event: "forgot_password", req });

    return res.status(200).json({ message: successMessage });
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    const hashedResetToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    user.tokenVersion += 1;

    await Session.updateMany({ user: user._id, revoked: false }, { revoked: true });
    await user.save();

    await recordAudit({ user: user._id, event: "reset_password", req });

    res.clearCookie("accessToken", authCookieOptions);
    res.clearCookie("refreshToken", authCookieOptions);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    return next(err);
  }
}

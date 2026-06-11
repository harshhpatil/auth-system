import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../services/token.service.js";
import { authCookieOptions, recordAudit } from "./auth.helpers.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "invalid credentials" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox.",
      });
    }

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.emailVerificationToken;
    delete sanitizedUser.emailVerificationTokenExpiry;
    delete sanitizedUser.passwordResetToken;
    delete sanitizedUser.passwordResetTokenExpiry;

    const accessToken = generateAccessToken(sanitizedUser);
    const refreshToken = generateRefreshToken();
    const tokenHash = await hashToken(refreshToken);

    await Session.create({
      user: sanitizedUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.cookie("accessToken", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await recordAudit({ user: sanitizedUser._id, event: "login", req });

    return res.status(200).json({ message: "Successfully logged in" });
  } catch (err) {
    return next(err);
  }
}

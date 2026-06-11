import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
} from "../../services/token.service.js";
import { authCookieOptions, recordAudit } from "./auth.helpers.js";

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "unauthorized" });

    let matchedSession = null;
    const sessions = await Session.find({
      revoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    for (const session of sessions) {
      const isMatch = await verifyToken(refreshToken, session.tokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const user = await User.findById(matchedSession.user);
    if (!user) return res.status(401).json({ message: "unauthorized" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await hashToken(newRefreshToken);

    matchedSession.tokenHash = newRefreshTokenHash;
    matchedSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    matchedSession.revoked = false;
    await matchedSession.save();

    await recordAudit({ user: matchedSession.user, event: "refresh_token", req });

    res.cookie("accessToken", newAccessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "tokens refreshed successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "unauthorized" });

    let matchedSession = null;
    const sessions = await Session.find({ revoked: false })
      .limit(100)
      .select("_id tokenHash user");

    for (const session of sessions) {
      const isMatch = await verifyToken(refreshToken, session.tokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      return res.status(401).json({ message: "unauthorized" });
    }

    matchedSession.revoked = true;
    await matchedSession.save();

    res.clearCookie("accessToken", authCookieOptions);
    res.clearCookie("refreshToken", authCookieOptions);
    await recordAudit({ user: matchedSession.user, event: "logout", req });

    return res.status(200).json({ message: "logged out successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function getSessions(req, res, next) {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ user: userId })
      .select("-tokenHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({ sessions });
  } catch (err) {
    return next(err);
  }
}

export async function logoutSession(req, res, next) {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "session not found" });
    if (session.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "unauthorized" });
    }

    session.revoked = true;
    await session.save();

    await recordAudit({
      user: user._id,
      event: "logout_session",
      req,
      meta: { sessionId },
    });

    return res.status(200).json({ message: "session logged out successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function logoutAllSessions(req, res, next) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    await Session.updateMany({ user: userId, revoked: false }, { revoked: true });
    user.tokenVersion += 1;
    await user.save();

    await recordAudit({ user: user._id, event: "logout_all_sessions", req });

    return res.status(200).json({ message: "all sessions logged out successfully" });
  } catch (err) {
    return next(err);
  }
}

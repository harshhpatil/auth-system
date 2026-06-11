import Audit from "../../models/audit.model.js";

const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
};

export async function recordAudit({ user, event, req, meta }) {
  try {
    await Audit.create({
      user,
      event,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      meta,
    });
  } catch {
    // audit logging must never break the auth flow
  }
}

export function createHttpError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

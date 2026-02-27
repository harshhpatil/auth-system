import { Router } from "express";
import {
  login,
  register,
  verifyEmail,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimitter.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../utils/validation.js";

const router = Router();

// defining the auth routes
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/register", registerLimiter, validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;

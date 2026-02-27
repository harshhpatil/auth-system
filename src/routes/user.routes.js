import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import roleGuard from "../middleware/role.middleware.js";

const router = Router();

// Any authenticated user can access
router.get("/profile", authenticate, (req, res) => {
  res.status(200).json({
    message: "Profile accessed",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Only admin can access
router.get("/admin-dashboard", authenticate, roleGuard(["admin"]), (req, res) => {
  res.status(200).json({
    message: "Admin dashboard accessed",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Any authenticated user can access
router.get("/settings", authenticate, (req, res) => {
  res.status(200).json({
    message: "User settings",
    user: {
      email: req.user.email,
      emailVerified: req.user.emailVerified,
    },
  });
});

export default router;
import rateLimit from "express-rate-limit";

// rate limitting login route : allowing 7 attempts max for 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 7,
  message: "too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// rate limitting register route: allowing 5 attempts max for 60 minutes
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "too many register attempts, please try again after 60 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});


export { loginLimiter, registerLimiter }; // exporting the limiters
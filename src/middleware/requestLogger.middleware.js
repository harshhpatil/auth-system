import logger from "../utils/logger.js";

// reuest logger middleware to log incoming reqs and details
export default function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });
  next();
}

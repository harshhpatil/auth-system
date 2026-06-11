import logger from "../utils/logger.js";

// gloabal error handeller function to handel unhandelled errors in the application
export default function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  const status = err.status || 500;
  res
    .status(status)
    .json({ message: status === 500 ? "Internal server error" : err.message });
}

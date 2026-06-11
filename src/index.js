import "dotenv/config";
import dbConnection from "./config/dbConnection.js";
import app from "./app.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";

// defining the constants
const PORT = process.env.PORT;

// function for starting the server
async function startServer() {
  if (!PORT) {
    throw new Error("PORT env variable doesn't exists or not loaded properly");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET env variable doesn't exist or not loaded properly",
    );
  }

  const HEALTH_URL = `http://127.0.0.1:${PORT}/health`;

  await dbConnection();
  app.listen(PORT, () => {
    logger.info(
      `server successfully running on ${PORT}. \ncheck the health of the server: ${HEALTH_URL}`,
    );
  });
}

// calling the startServer function
startServer().catch((err) => {
  logger.error("server failed to start", err);
  process.exit(1);
});

// graceful shutdown function 
async function shutdown(signal) {
  try {
    logger.info(`Received ${signal}, shutting down`);
    await mongoose.disconnect();
    logger.info("Mongo disconnected");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

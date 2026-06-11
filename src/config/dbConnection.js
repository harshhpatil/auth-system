import mongoose from "mongoose";
import logger from "../utils/logger.js";

const dbConnection = async () => {
  // check if the connection string is loaded through the env variables or not
  if (!process.env.MONGO_URI) {
    logger.error(
      ".MONGO_URI env variable doesn't exist or not loaded properly",
    );
    throw new Error(
      ".MONGO_URI env variable doesn't exist or not loaded properly",
    );
  }

  try {
    // if the connection is already established then return
    if (mongoose.connection.readyState === 1) {
      return;
    }

    // handeling the connection events
    mongoose.connection.on("disconnected", () => {
      logger.warn("disconnected from the database");
    });
    mongoose.connection.on("error", (err) => {
      logger.error("error occured in the database: ", err);
    });

    // connecting to the database
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("connected to the database successfully");
  } catch (err) {
    logger.error("database connection failed,", err.message);
    throw err;
  }
};

export default dbConnection; // exporting the connection function

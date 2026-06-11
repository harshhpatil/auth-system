import redis from "ioredis";
import logger from "../utils/logger.js";

let redisClient;

// function to close the redis connection
export async function closeRedisConnection() {
  if (!redisClient) {
    return;
  }

  await redisClient.quit();
  redisClient = undefined;
}

// function to create redis client instance
export const redisInstance = async () => {
  // check if the connection string is loaded through the env variables or not
  if (!process.env.REDIS_URL) {
    logger.error(
      ".REDIS_URL env variable doesn't exist or not loaded properly",
    );
    throw new Error(
      ".REDIS_URL env variable doesn't exist or not loaded properly",
    );
  }

  try {
    // if the connection is already established then return
    if (redisClient) {
      return redisClient;
    }

    // creating a new redis client
    redisClient = new redis(process.env.REDIS_URL);

    // handeling the connection events
    redisClient.on("connect", () => {
      logger.info("connected to redis successfully");
    });

    redisClient.on("error", (err) => {
      logger.error("redis connection error", err);
    });

    redisClient.on("close", () => {
      logger.warn("redis connection closed");
    });

    return redisClient; // returning the redis client instance
  } catch (err) {
    logger.error("Error occurred while connecting to redis", err);
    throw err;
  }
};

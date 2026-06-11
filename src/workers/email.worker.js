import "dotenv/config";
import { Worker } from "bullmq";
import { closeRedisConnection, redisInstance } from "../config/redis.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/email.service.js";
import logger from "../utils/logger.js";

// concurrency for processing email jobs
const workerConcurrency = Number.parseInt(
  process.env.EMAIL_WORKER_CONCURRENCY ?? "5",
  10,
);

// initializing the email worker
const worker = new Worker(
  "email-jobs",
  async (job) => {
    switch (job.name) {
      case "verification-email":
        await sendVerificationEmail(job.data.email, job.data.verificationLink);
        return;
      case "welcome-email":
        await sendWelcomeEmail(job.data.email);
        return;
      case "password-reset-email":
        await sendPasswordResetEmail(
          job.data.email,
          job.data.passwordResetLink,
        );
        return;
      default:
        throw new Error(`Unsupported email job: ${job.name}`);
    }
  },
  {
    connection: await redisInstance(),
    concurrency: Number.isNaN(workerConcurrency) ? 5 : workerConcurrency,
  },
);

// logging worker events
worker.on("completed", (job) => {
  logger.info(`email job completed: ${job.name} (${job.id})`);
});

worker.on("failed", (job, err) => {
  logger.error(
    `email job failed: ${job?.name ?? "unknown"} (${job?.id ?? "unknown"})`,
    err,
  );
});

// shutting down the email worker
async function shutdown(signal) {
  try {
    logger.info(`Received ${signal}, shutting down email worker`);
    await worker.close();
    await closeRedisConnection();
    process.exit(0);
  } catch (err) {
    logger.error("Error during email worker shutdown", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

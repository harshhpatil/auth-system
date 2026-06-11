import { Queue } from "bullmq";
import { redisInstance } from "../config/redis.js";

let emailQueue;

// function to create email queue instance
async function getEmailQueue() {
  // returning if the queue exists
  if (emailQueue) {
    return emailQueue;
  }

  // creating a new queue
  emailQueue = new Queue("email-jobs", {
    connection: await redisInstance(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
        count: 500,
      },
      removeOnFail: false,
    },
  });

  return emailQueue;
}

// function to enqueue email jobs
export async function enqueueEmailJob(name, data, opts = {}) {
  return (await getEmailQueue()).add(name, data, opts);
}

export default getEmailQueue;

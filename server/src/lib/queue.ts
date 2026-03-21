import Bull from 'bull';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const queues: Bull.Queue[] = [];

export function createQueue(name: string): Bull.Queue {
  const queue = new Bull(name, env.REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });

  queue.on('failed', (job, err) => {
    logger.error({ queue: name, jobId: job.id, err: err.message }, 'Queue job failed');
  });

  queue.on('completed', (job) => {
    logger.debug({ queue: name, jobId: job.id }, 'Queue job completed');
  });

  queues.push(queue);
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all(queues.map((q) => q.close()));
  logger.info(`Closed ${queues.length} Bull queues`);
}

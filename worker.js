import { Worker } from 'bullmq';
import { connection } from './config/redis.js';
import { processPRReview } from './services/reviewService.js';

console.log('🔧 Starting CodeReview.ai Worker...\n');

if (!connection) {
  console.error('❌ Redis connection not available. Worker cannot start.');
  console.error('   Please install Redis or Memurai (https://memurai.com)');
  process.exit(1);
}

// Create worker to process review jobs
const worker = new Worker(
  'pr-review',
  async (job) => {
    console.log(`\n⚡ Worker picked up job: ${job.id}`);
    console.log(`📋 Job data:`, JSON.stringify(job.data, null, 2));

    try {
      await processPRReview(job.data);
      console.log(`✅ Job ${job.id} completed successfully\n`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      throw error; // BullMQ will retry based on job options
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 jobs at a time
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute (rate limiting)
    },
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`✨ Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 Job ${job?.id} has failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('⚠️  Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

console.log('✅ Worker is ready and waiting for jobs...\n');

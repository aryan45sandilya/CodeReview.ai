import express from 'express';
import { verifyWebhookSignature } from '../config/github.js';
import { reviewQueue } from '../config/redis.js';
import { db } from '../config/database.js';

const router = express.Router();

// Webhook handler - must respond quickly (< 10s)
router.post('/webhook', express.json({ verify: captureRawBody }), async (req, res) => {
  try {
    // 1. Verify webhook signature
    const signature = req.headers['x-hub-signature-256'];
    const isValid = verifyWebhookSignature(req.rawBody, signature);

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Parse webhook payload
    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`✅ Received webhook: ${event}`);

    // 3. Handle pull_request events
    if (event === 'pull_request') {
      const action = payload.action;
      
      // Only process opened and synchronize (new commits) events
      if (action === 'opened' || action === 'synchronize') {
        const pr = payload.pull_request;
        const repo = payload.repository;
        const installation = payload.installation;

        console.log(`📝 PR ${action}: ${repo.full_name}#${pr.number}`);

        // Check if repo exists and is active
        // First find installation by github_installation_id
        let installationRecord = await db.findInstallationByGithubId(installation.id);

        // Create installation if not exists
        if (!installationRecord) {
          let userRecord = await db.findUserByGithubUsername(payload.sender.login);
          if (!userRecord) {
            userRecord = await db.createUser(payload.sender.login);
          }
          // installation.account can be undefined, use sender login as fallback
          const accountLogin = installation.account?.login || payload.sender.login;
          installationRecord = await db.createInstallation(
            userRecord.id,
            installation.id,
            accountLogin
          );
        }

        // Now find repo using installation UUID
        let repoRecord = await db.findRepoByInstallationAndFullName(installationRecord.id, repo.full_name);

        // Create repo if it doesn't exist
        if (!repoRecord) {
          repoRecord = await db.createRepo(installationRecord.id, repo.full_name);
        }

        // Only enqueue if repo is active
        if (repoRecord.active) {
          // Create or update PR record
          const prRecord = await db.findOrCreatePullRequest(
            repoRecord.id,
            pr.number,
            pr.head.sha
          );

          // 4. Enqueue job to BullMQ (async processing) or process synchronously
          if (reviewQueue) {
            const job = await reviewQueue.add('review-pr', {
              prId: prRecord.id,
              installationId: installation.id,
              repoFullName: repo.full_name,
              prNumber: pr.number,
              headSha: pr.head.sha,
              baseRef: pr.base.ref,
              headRef: pr.head.ref,
            });

            console.log(`🚀 Job enqueued: ${job.id}`);
          } else {
            console.log(`⚠️  Processing synchronously (Redis not available)`);
            // Import and call review service directly
            const { processReview } = await import('../services/reviewService.js');
            processReview({
              prId: prRecord.id,
              installationId: installation.id,
              repoFullName: repo.full_name,
              prNumber: pr.number,
              headSha: pr.head.sha,
              baseRef: pr.base.ref,
              headRef: pr.head.ref,
            }).catch(err => console.error('Review error:', err));
          }
        } else {
          console.log(`⏭️  Skipping inactive repo: ${repo.full_name}`);
        }
      }
    }

    // Handle installation events
    if (event === 'installation' || event === 'installation_repositories') {
      console.log(`🔧 Installation event: ${payload.action}`);
      // Handle installation/uninstallation if needed
    }

    // 5. Always respond 200 OK quickly
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent GitHub from disabling the webhook
    res.status(200).json({ error: error.message });
  }
});

// Middleware to capture raw body for signature verification
function captureRawBody(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

export default router;

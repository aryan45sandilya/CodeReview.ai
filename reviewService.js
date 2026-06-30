import { getInstallationOctokit } from '../config/github.js';
import { parsePRDiff, getGitHubPosition, batchFilesForReview } from './diffService.js';
import { reviewCodeWithAI } from './aiService.js';
import { db } from '../config/database.js';

export async function processReview(jobData) {
  return processPRReview(jobData);
}

export async function processPRReview(jobData) {
  const { prId, installationId, repoFullName, prNumber, headSha } = jobData;
  
  console.log(`\n🔍 Processing review for ${repoFullName}#${prNumber}`);

  try {
    // Update PR status to processing
    await db.updatePullRequestStatus(prId, 'processing');

    // 1. Get authenticated Octokit for this installation
    const octokit = await getInstallationOctokit(installationId);

    // 2. Fetch PR files
    const [owner, repo] = repoFullName.split('/');
    const { data: prFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    console.log(`📄 Found ${prFiles.length} files in PR`);

    // 3. Get full diff as unified diff format
    const { data: diffData } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: 'diff' },
    });

    // 4. Parse the diff
    const parsedFiles = parsePRDiff(diffData);
    console.log(`✅ Parsed ${parsedFiles.length} reviewable files`);

    if (parsedFiles.length === 0) {
      console.log('⏭️  No files to review, skipping');
      await db.updatePullRequestStatus(prId, 'completed');
      return;
    }

    // 5. Get custom rules for this repo
    const prRecord = await db.findPullRequestById(prId);
    const repoId = prRecord.repos?.id || prRecord.repo_id;
    const customRules = await db.getCustomRulesForRepo(repoId);

    // 6. Batch files and review with AI
    const batches = batchFilesForReview(parsedFiles);
    let allReviews = [];
    let totalTokens = 0;

    for (let i = 0; i < batches.length; i++) {
      console.log(`🤖 Reviewing batch ${i + 1}/${batches.length}...`);
      try {
        const result = await reviewCodeWithAI(batches[i], customRules);
        allReviews = allReviews.concat(result.reviews);
        totalTokens += result.tokensUsed;
      } catch (aiError) {
        console.error(`⚠️  AI review failed, skipping:`, aiError.message);
      }
    }

    console.log(`💬 Generated ${allReviews.reduce((sum, r) => sum + r.comments.length, 0)} total comments`);

    // 7. Convert comments to GitHub review format
    const githubComments = [];

    for (const review of allReviews) {
      const parsedFile = review.parsedFile;
      
      for (const comment of review.comments) {
        const position = getGitHubPosition(parsedFile, comment.line);
        
        if (position !== null) {
          githubComments.push({
            path: review.file,
            position,
            body: `**[${comment.severity.toUpperCase()}]** ${comment.comment}`,
          });
        } else {
          // Fallback: comment on file without specific line
          githubComments.push({
            path: review.file,
            body: `**[${comment.severity.toUpperCase()}]** (Line ${comment.line}) ${comment.comment}`,
          });
        }
      }
    }

    // 8. Post review to GitHub (single API call)
    if (githubComments.length > 0) {
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: 'COMMENT',
        body: '🤖 **CodeReview.ai** automated review completed',
        comments: githubComments,
      });
      console.log(`✅ Posted ${githubComments.length} comments to GitHub`);
    } else {
      await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: 'COMMENT',
        body: '🤖 **CodeReview.ai** review completed - no issues found! ✨',
      });
      console.log('✅ Posted general review comment (no issues)');
    }

    // 9. Save review to database
    const reviewRecord = await db.createReview(prId, totalTokens, 'gemini-2.0-flash');

    // Save individual comments
    for (const review of allReviews) {
      for (const comment of review.comments) {
        await db.createReviewComment(
          reviewRecord.id,
          review.file,
          comment.line,
          comment.severity,
          comment.comment
        );
      }
    }

    // 10. Update PR status to completed
    await db.updatePullRequestStatus(prId, 'completed');

    console.log(`🎉 Review completed for ${repoFullName}#${prNumber}\n`);

  } catch (error) {
    console.error(`❌ Error processing review:`, error);

    // Update PR status to failed
    await db.updatePullRequestStatus(prId, 'failed');

    throw error;
  }
}

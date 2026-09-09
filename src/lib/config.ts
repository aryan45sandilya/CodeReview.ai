export const requireEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

function lazyEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function lazyInt(key: string, defaultVal: number): number {
  const raw = process.env[key] ?? String(defaultVal);
  const n = parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${key} must be a non-negative integer, got: ${raw}`);
  return n;
}

export const config = {
  get githubAppId() {
    const raw = lazyEnv('GITHUB_APP_ID');
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`GITHUB_APP_ID must be a positive integer, got: ${raw}`);
    return n;
  },
  get githubPrivateKey() { return lazyEnv('GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n'); },
  get githubWebhookSecret() { return lazyEnv('GITHUB_WEBHOOK_SECRET'); },
  get groqApiKey() { return lazyEnv('GROQ_API_KEY'); },
  get groqModel() { return process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'; },
  get redisUrl() { return process.env.REDIS_URL ?? 'redis://localhost:6379'; },
  get dailyReviewLimit() { return lazyInt('DAILY_REVIEW_LIMIT', 50); },
  get workerConcurrency() {
    const n = parseInt(process.env.WORKER_CONCURRENCY ?? '3', 10);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`WORKER_CONCURRENCY must be a positive integer`);
    return n;
  },
  get maxDiffTokens() {
    const n = parseInt(process.env.MAX_DIFF_TOKENS ?? '30000', 10);
    if (!Number.isInteger(n) || n <= 0) throw new Error(`MAX_DIFF_TOKENS must be a positive integer`);
    return n;
  },
  get nextAuthSecret() { return lazyEnv('NEXTAUTH_SECRET'); },
};

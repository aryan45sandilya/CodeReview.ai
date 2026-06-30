<div align="center">

<img src="https://img.shields.io/badge/CodeReview.ai-AI%20Powered-10b981?style=for-the-badge&logo=github&logoColor=white" alt="CodeReview.ai" />

# CodeReview.ai

### AI-powered GitHub Pull Request reviewer that automatically reviews your code

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-AI%20Engine-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<br/>

> Open a Pull Request → Get instant AI code review comments 🤖

</div>

---

## ✨ What It Does

When a developer opens or updates a Pull Request, **CodeReview.ai** automatically:

1. 📥 Receives the GitHub webhook
2. 🔍 Fetches and parses the code diff
3. 🤖 Sends code to AI (Groq / LLaMA 3.3 70B) for review
4. 💬 Posts inline comments directly on the PR
5. 💾 Saves review history to the database

---

## 🖥️ Dashboard Preview

```
┌──────────────────────────────────────────┐
│  CodeReview.ai    Dashboard  Repos  ⚙️   │
├──────────────────────────────────────────┤
│  Active Repos  │  Pull Requests  │ Reviews│
│      5         │       12        │   8    │
├──────────────────────────────────────────┤
│  aryan45sandilya/EventHub    ACTIVE  ✅  │
│  aryan45sandilya/react-app   ACTIVE  ✅  │
│  aryan45sandilya/nodejs-api  INACTIVE ❌ │
└──────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
GitHub PR opened/updated
        │
        ▼ webhook
┌──────────────────┐
│  Express Server  │  ← Verifies HMAC signature
│  /webhook        │  ← Returns 200 OK instantly
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│           Review Pipeline            │
│                                      │
│  1. Fetch PR diff  (Octokit)         │
│  2. Parse files    (parse-diff)      │
│  3. AI Review      (Groq LLaMA)      │
│  4. Post comments  (GitHub API)      │
│  5. Save to DB     (Supabase)        │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  GitHub PR       │  ← Inline review comments appear
│  Comments        │  ← [BUG], [SUGGESTION], [NITPICK]
└──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express |
| **Frontend** | React + Vite + Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **AI Engine** | Groq API (LLaMA 3.3 70B) |
| **GitHub** | GitHub App + Octokit.js |
| **Tunnel** | Cloudflare Tunnel (local dev) |
| **Diff Parsing** | parse-diff |

---

## 🚀 Quick Setup

### Prerequisites

- Node.js 20+
- GitHub account
- Supabase account (free)
- Groq API key (free)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/codereview-ai.git
cd codereview-ai
npm install
cd frontend && npm install && cd ..
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Open **SQL Editor** → Run `supabase-schema.sql`
3. Go to **Settings → API** → Copy URL and anon key

### 3. Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create API Key → Copy it

### 4. Setup GitHub App

1. Go to `https://github.com/settings/apps/new`
2. Set permissions: **Pull requests → Read & Write**, **Contents → Read**
3. Subscribe to: **Pull request** events
4. Generate & download private key
5. Save as `private-key.pem` in project root

### 5. Configure Environment

```bash
cp .env.example .env
```

```env
# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# AI
GROQ_API_KEY=gsk_your_groq_key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# Server
PORT=3002
NODE_ENV=development
```

### 6. Start the App

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Cloudflare Tunnel (for webhooks):**
```bash
npx cloudflared tunnel --url http://localhost:3002
```

**Terminal 3 — Frontend:**
```bash
npm run dev:frontend
```

### 7. Update Webhook URL

Copy the Cloudflare tunnel URL and update in GitHub App settings:
```
https://your-tunnel-url.trycloudflare.com/webhook
```

### 8. Test It!

Open a Pull Request on any installed repository → Watch AI review appear! 🎉

---

## 💬 AI Review Example

When a PR is opened, you'll see comments like:

```
🤖 CodeReview.ai automated review completed

[BUG] Line 42: Variable 'user' can be null here — add a null check before accessing user.name

[SUGGESTION] Line 67: Consider using async/await instead of .then() chains for better readability

[NITPICK] Line 89: Variable name 'x' is not descriptive — consider renaming to 'eventCount'
```

---

## 📊 Database Schema

```
users
  └── installations
        └── repos
              └── pull_requests
                    └── reviews
                          └── review_comments

repos
  └── custom_rules
```

---

## 🔐 Security

- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ GitHub App JWT authentication
- ✅ Installation-scoped access tokens
- ✅ Environment variable secrets
- ✅ `.env` and `private-key.pem` in `.gitignore`

---

## 📁 Project Structure

```
codereview-ai/
├── backend/
│   └── src/
│       ├── config/          # github, supabase, redis, env
│       ├── routes/          # webhook.js, api.js
│       ├── services/        # aiService, reviewService, diffService
│       └── server.js
├── frontend/
│   └── src/
│       ├── pages/           # Dashboard, Repositories, Settings
│       ├── App.jsx
│       └── main.jsx
├── supabase-schema.sql      # Database schema
├── .env.example
└── private-key.pem          # GitHub App private key (gitignored)
```

---

## 📝 License

MIT © 2026

---

<div align="center">

Built with ❤️ using Groq AI + Supabase + GitHub Apps

⭐ Star this repo if you find it useful!

</div>

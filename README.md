<p align="center">
  <img src="./public/favicon.svg" width="64" height="64" alt="">
</p>

<h1 align="center">CodeReview.ai</h1>

<p align="center">Automated GitHub pull request reviews with inline findings, severity rankings, and optional email summaries.</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&amp;logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square" alt="Redis and BullMQ">
  <img src="https://img.shields.io/badge/Groq-F55036?style=flat-square" alt="Groq">
  <img src="https://img.shields.io/badge/license-GPL--3.0-F5C200?style=flat-square" alt="License GPL-3.0">
</p>

## What it does

- **Inline reviews** tie findings to changed lines in a pull request.
- **Severity rankings** group security, bug, and style findings as Blocker, Major, Minor, or Nit.
- **Email summaries** include severity counts and top findings when SMTP is configured.
- **A review dashboard** shows job status behind GitHub sign-in.

## How it works

1. The GitHub App receives a pull request webhook. The Next.js endpoint verifies the signature and queues a review in BullMQ.
2. A worker fetches the diff with a GitHub App installation token and sends it to Groq for review.
3. The worker posts the findings on GitHub and sends a summary email when configured.

Redis backs the queue and the per-installation review limit. The worker runs separately from the webhook endpoint so GitHub receives a prompt acknowledgement.

## Quick start

Use Node.js **20.19 or newer** and a running Redis instance. Create a GitHub App to receive pull request events and a GitHub OAuth App for dashboard login.

1. Install dependencies with `npm ci`.
2. Create `.env.local` in the repository root and fill in the variables from the [setup guide](docs/SETUP.md#3-environment-variables).
3. Start the web app with `npm run dev`. It listens on port **3001**.
4. Start the review worker in a separate terminal with `npm run worker:dev`.
5. [Forward GitHub webhooks](docs/SETUP.md#4-run-locally) to `/api/webhooks/github` and open a pull request in a repository where the app is installed.

## Repository layout

| Path | Contents |
| --- | --- |
| `src/app/` | Web app, dashboard, authentication, and API routes |
| `src/lib/` | GitHub, Groq, queue, rate limit, and email integrations |
| `worker/` | Background review worker |
| `docs/` | Setup, architecture, and product documentation |
| `Dockerfile` and `railway.toml` | Container and Railway configuration |

## Documentation

- [Setup and deployment](docs/SETUP.md)
- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Engineering decisions](docs/DECISIONS.md)
- [Product requirements](docs/PRD.md)

## Maintainer

**Aryan Sandilya** · [GitHub](https://github.com/aryan45sandilya)

See [Authors](AUTHORS.md), [Contributors](CONTRIBUTORS.md), and the [contribution guide](CONTRIBUTING.md).

# Contributing to CodeReview.ai

Maintainer is [Aryan Sandilya](https://github.com/aryan45sandilya).

## Set up locally

Use the [setup guide](docs/SETUP.md) to configure the web app, Redis, and the review worker. Run `npm ci` to install dependencies.

## Submit a change

1. Open an issue for a bug or proposed feature. For bugs, include reproduction steps and the expected behavior.
2. Create a branch from `main` and keep the change focused.
3. Run `npm run lint` and `npm run build`. For changes to the review pipeline, run the web app and worker, then open a test pull request in a repository where the app is installed.
4. Open a pull request describing the change and how you verified it.

Keep credentials, private keys, and local environment files out of commits. Redact secrets before sharing webhook payloads or logs.

#!/bin/bash
set -euo pipefail

if ! command -v gh &> /dev/null; then
  echo "Error: gh CLI is required. Install it from https://cli.github.com"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "Error: Not logged in. Run 'gh auth login' first."
  exit 1
fi

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Copy .env.example to .env and fill in your values first."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "Pushing secrets to GitHub..."

if [ -n "${DEPLOY_WEBHOOK_URL:-}" ]; then
  gh secret set DEPLOY_WEBHOOK_URL --body "$DEPLOY_WEBHOOK_URL"
  echo "  DEPLOY_WEBHOOK_URL set"
else
  echo "  DEPLOY_WEBHOOK_URL skipped (not set in $ENV_FILE)"
fi

echo "Done."

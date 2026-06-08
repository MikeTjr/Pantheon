#!/usr/bin/env bash
set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN environment variable is not set."
  echo "Add it in the Secrets tab (key: GITHUB_TOKEN, value: your GitHub personal access token)."
  exit 1
fi

REPO_URL="https://${GITHUB_TOKEN}@github.com/MikeTjr/Pantheon.git"

git config user.email "replit-sync@users.noreply.github.com" 2>/dev/null || true
git config user.name "Replit Sync" 2>/dev/null || true

if [ -n "$(git status --porcelain)" ]; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git add -A
  git commit -m "Auto-sync: ${TIMESTAMP}"
  echo "Committed pending changes."
else
  echo "Nothing new to commit."
fi

COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" -gt 0 ]; then
  git push "$REPO_URL" HEAD:main
  echo "Pushed ${COMMITS_AHEAD} commit(s) to GitHub successfully."
else
  echo "GitHub is already up to date."
fi

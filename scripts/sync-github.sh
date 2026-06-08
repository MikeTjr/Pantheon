#!/usr/bin/env bash
set -euo pipefail

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_TOKEN secret is not set."
  echo "Add it in the Secrets tab (key: GITHUB_TOKEN, value: your GitHub personal access token)."
  exit 1
fi

git config user.email "replit-sync@users.noreply.github.com"
git config user.name "Replit Sync"

git config credential.helper \
  '!f() { echo username=x-token-auth; printf "password=%s\n" "$GITHUB_TOKEN"; }; f'

if [ -n "$(git status --porcelain)" ]; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git add -A
  git commit -m "Auto-sync: ${TIMESTAMP}"
  echo "Committed pending changes."
else
  echo "Nothing new to commit."
fi

COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD)
if [ "$COMMITS_AHEAD" -gt 0 ]; then
  git push origin HEAD:main
  echo "Pushed ${COMMITS_AHEAD} commit(s) to GitHub successfully."
else
  echo "GitHub is already up to date."
fi

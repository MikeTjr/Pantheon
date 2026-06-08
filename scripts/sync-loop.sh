#!/usr/bin/env bash

INTERVAL_MINUTES=${SYNC_INTERVAL_MINUTES:-30}
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))

echo "GitHub auto-sync started. Syncing every ${INTERVAL_MINUTES} minute(s)."
echo "-----------------------------------------------------------------------"

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running sync..."
  bash "$(dirname "$0")/sync-github.sh" || echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync failed (see above)."
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Next sync in ${INTERVAL_MINUTES} minute(s)."
  sleep "$INTERVAL_SECONDS"
done

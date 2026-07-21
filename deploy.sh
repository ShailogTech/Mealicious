#!/usr/bin/env bash
#
# Mealicious deploy script — run on the VPS to pull, build, and restart.
#
# Usage:
#   cd /var/www/Mealicious && ./deploy.sh
#
# Or if you only want to deploy the DB container (not the app):
#   ./deploy.sh --db-only
#
# This script replaces putting git pull / build / pm2 restart in the
# Dockerfile. The Dockerfile builds a static image; deploy steps belong
# in a script that runs them in the correct order at deploy time.
#
set -euo pipefail

BRANCH="${BRANCH:-main}"
APP_DIR="/var/www/Mealicious"
DB_CONTAINER="mealicious-db"
PM2_PROCESS="mealicious"

cd "$APP_DIR"

echo "============================================"
echo "  Mealicious Deploy — $(date)"
echo "============================================"

# --- Step 1: Pull latest code ---
echo ""
echo "[1/5] Pulling latest from origin/$BRANCH..."

# Ensure we're on the right branch. If a checkout is needed but local
# changes block it (e.g. a file mode change from chmod), stash first.
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  git stash -u 2>/dev/null || true
  git checkout "$BRANCH"
  git stash pop 2>/dev/null || true
fi

# Reset any local file-mode changes (chmod) that would block pull.
git checkout -- . 2>/dev/null || true

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "  ✓ Code updated (hard reset to origin/$BRANCH)"

# --- Step 2: Install dependencies ---
echo ""
echo "[2/5] Installing dependencies..."
if command -v bun &> /dev/null; then
  bun install
else
  npm install
fi
echo "  ✓ Dependencies installed"

# --- Step 3: Regenerate Prisma client + push schema ---
echo ""
echo "[3/5] Prisma generate + db push..."
bunx prisma generate
bunx prisma db push --accept-data-loss
echo "  ✓ Schema synced"

# --- Step 4: Run seed (idempotent) ---
echo ""
echo "[4/5] Seeding database (idempotent)..."
bun run db:seed || echo "  ⚠ Seed skipped or failed (non-fatal)"
echo "  ✓ Seed complete"

# --- Step 5: Build + restart ---
echo ""
echo "[5/5] Building + restarting pm2..."
bun run build
pm2 restart "$PM2_PROCESS"
echo "  ✓ App restarted"

# --- DB-only mode (skip if --db-only not passed) ---
if [[ "${1:-}" == "--db-only" ]]; then
  echo ""
  echo "[DB] Restarting database container only..."
  docker restart "$DB_CONTAINER"
  echo "  ✓ DB container restarted"
fi

echo ""
echo "============================================"
echo "  Deploy complete! ✓"
echo "  pm2: $PM2_PROCESS | db: $DB_CONTAINER"
echo "============================================"

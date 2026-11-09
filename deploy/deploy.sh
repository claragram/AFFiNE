#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VPS_HOST="${VPS_HOST:-192.168.1.16}"
VPS_USER="${VPS_USER:-me}"
VPS_TARGET="~/apps/claranote"

echo "=== [1/4] Bundling Claranote Frontends ==="
cd "$ROOT_DIR/codebase"
GITHUB_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "canary-prod")
export GITHUB_SHA
yarn affine bundle -p @affine/web
yarn affine bundle -p @affine/admin
yarn affine bundle -p @affine/mobile

echo "=== [2/3] Syncing Directly to VPS ($VPS_USER@$VPS_HOST) ==="
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_TARGET/config $VPS_TARGET/nginx $VPS_TARGET/static $VPS_TARGET/admin $VPS_TARGET/mobile $VPS_TARGET/website $VPS_TARGET/data/postgres $VPS_TARGET/data/storage $VPS_TARGET/data/caddy_data $VPS_TARGET/data/caddy_config"

rsync -avz "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR/compose.yml" "$SCRIPT_DIR/Caddyfile" "$VPS_USER@$VPS_HOST:$VPS_TARGET/"
rsync -avz "$SCRIPT_DIR/config/" "$VPS_USER@$VPS_HOST:$VPS_TARGET/config/"
rsync -avz "$SCRIPT_DIR/nginx/" "$VPS_USER@$VPS_HOST:$VPS_TARGET/nginx/" 2>/dev/null || true
rsync -avz --delete "$SCRIPT_DIR/website/" "$VPS_USER@$VPS_HOST:$VPS_TARGET/website/"
rsync -avz --delete codebase/packages/frontend/apps/web/dist/ "$VPS_USER@$VPS_HOST:$VPS_TARGET/static/"
rsync -avz --delete codebase/packages/frontend/admin/dist/ "$VPS_USER@$VPS_HOST:$VPS_TARGET/admin/"
rsync -avz --delete codebase/packages/frontend/apps/mobile/dist/ "$VPS_USER@$VPS_HOST:$VPS_TARGET/mobile/"

echo "=== [3/3] Building & Starting Claranote Stack on VPS ==="
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_TARGET && /Users/me/.local/bin/docker compose build && /Users/me/.local/bin/docker compose up -d"

echo "=== Claranote Live Deployment Complete! ==="
echo "Access URLs:"
echo " - Production Domain: https://claranote.com (and http://claranote.com)"
echo " - Direct VPS Host:    http://$VPS_HOST:3010/ (and http://$VPS_HOST:80/)"
echo " - Admin Console:     http://$VPS_HOST:3010/admin"
echo " - GraphQL Endpoint:  http://$VPS_HOST:3010/graphql"

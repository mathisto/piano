#!/usr/bin/env bash
# Build and publish to pianoforte.mattkelly.io (quartz, behind the Cloudflare tunnel).
# One-time server setup (Caddy block, tunnel ingress, DNS) is in the homelab repo: 2026-10-18-piano-site.md
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=${DEPLOY_HOST:-quartz}
DEST=/opt/piano
STAMP=$(date +%Y%m%d-%H%M%S)

[ -z "$(git status --porcelain)" ] || { echo "tree is dirty: commit and push first, so the deployed commit has a name" >&2; exit 1; }
npm test --silent
npm run build --silent
git rev-parse HEAD > dist/version.txt

tar -C dist -cf - . | ssh "$HOST" "set -e
  rm -rf $DEST/dist.new && mkdir -p $DEST/dist.new/assets
  # a tab still running the last build asks for its own hashed chunks: carry the recent ones over (content-addressed, so a name never changes meaning)
  [ -d $DEST/dist/assets ] && find $DEST/dist/assets -type f -mtime -7 -exec cp -p {} $DEST/dist.new/assets/ \;
  tar -C $DEST/dist.new -xf -
  chown -R www-data:www-data $DEST/dist.new
  [ -d $DEST/dist ] && mv $DEST/dist $DEST/dist.old-$STAMP
  mv $DEST/dist.new $DEST/dist
  ls -dt $DEST/dist.old-* 2>/dev/null | tail -n +4 | xargs -r rm -rf"

curl -fsS -o /dev/null -w "index %{http_code}\n" https://pianoforte.mattkelly.io/
echo "deployed $(cat dist/version.txt | cut -c1-8)"

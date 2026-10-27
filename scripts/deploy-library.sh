#!/usr/bin/env bash
# Publish the big library (the pipeline's output in .cache/library/out/) to quartz:/opt/piano/corpus/, served at /corpus/ (docs/hosting.md).
# Pieces (p/<sha16>.mid|.mxl) are content-addressed: only ever added, never deleted, because a client may still hold an older catalogue
# that points at them. catalog.json goes last, by rename, so no client sees a catalogue whose files are not there yet.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=${DEPLOY_HOST:-quartz}
SRC=.cache/library/out
DEST=/opt/piano/corpus

[ -f "$SRC/catalog.json" ] && [ -d "$SRC/p" ] || { echo "no $SRC/catalog.json or $SRC/p: run the library pipeline first" >&2; exit 1; }

ssh "$HOST" "mkdir -p $DEST/p"
rsync -a --ignore-existing "$SRC/p/" "$HOST:$DEST/p/"
rsync -a --exclude /p --exclude /catalog.json "$SRC/" "$HOST:$DEST/" # LICENSES.md and anything else, before the catalogue
rsync -a "$SRC/catalog.json" "$HOST:/opt/piano/.catalog.json.new"        # outside the served root, same filesystem
ssh "$HOST" "set -e; chown -R www-data:www-data $DEST /opt/piano/.catalog.json.new; chmod -R u=rwX,go=rX $DEST; chmod 644 /opt/piano/.catalog.json.new; mv -f /opt/piano/.catalog.json.new $DEST/catalog.json"

curl -fsS -o /dev/null -w "catalog %{http_code}\n" https://pianoforte.mattkelly.io/corpus/catalog.json
echo "published $(ls "$SRC/p" | wc -l | tr -d ' ') pieces"

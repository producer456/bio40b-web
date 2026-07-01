#!/bin/bash
# Sync study data + figures from the iOS app repo into this static site.
# Students only READ this site; the owner updates it by re-running this and
# pushing. Figures are downscaled (max 1200px, JPEG) to keep the repo light.
#
# Usage:  bash tools/sync_assets.sh
set -euo pipefail

APP="${1:-/Users/admin/bio40b-ios}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC_CONTENT="$APP/Resources/Content"
SRC_FIG="$APP/Resources/Assets.xcassets/TextbookImages"

echo "→ copying chapter + objective JSON"
cp "$SRC_CONTENT"/ch*.json "$HERE/data/"
cp "$SRC_CONTENT/objective_cards.json" "$HERE/data/"

echo "→ optimizing figures into figures/ (max 1200px jpeg)"
mkdir -p "$HERE/figures"
count=0
for set in "$SRC_FIG"/*.imageset; do
  [ -d "$set" ] || continue
  img=$(find "$set" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | head -1)
  [ -n "$img" ] || continue
  base=$(basename "$set" .imageset)
  out="$HERE/figures/$base.jpg"
  # Resize + re-encode to JPEG; sips is built into macOS.
  sips -s format jpeg -Z 1200 "$img" --out "$out" >/dev/null 2>&1 || cp "$img" "$out"
  count=$((count+1))
done
echo "→ $count figures written"
du -sh "$HERE/figures" | awk '{print "   figures total: "$1}'

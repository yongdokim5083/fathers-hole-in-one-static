#!/usr/bin/env bash
set -euo pipefail
# Generate index.html from template with current git short hash to bust caches,
# commit the generated file and push to origin.

cd "$(dirname "$0")/.."
VERSION=$(git rev-parse --short HEAD)
TEMPLATE=index.template.html
OUT=index.html

if [ ! -f "$TEMPLATE" ]; then
  echo "Template $TEMPLATE not found"
  exit 1
fi

sed "s/__VERSION__/$VERSION/g" "$TEMPLATE" > "$OUT"

git add "$OUT"
git commit -m "chore(deploy): set site version $VERSION" || { echo "No changes to commit"; }
git push origin main

echo "Deployed version $VERSION"

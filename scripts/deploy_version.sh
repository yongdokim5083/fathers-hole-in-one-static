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

# Generate versioned CSS from template if present
CSS_TEMPLATE=css/style.template.css
CSS_OUT=css/style.css
if [ -f "$CSS_TEMPLATE" ]; then
  sed "s/__VERSION__/$VERSION/g" "$CSS_TEMPLATE" > "$CSS_OUT"
  git add "$CSS_OUT"
fi

git add "$OUT"

# Configure git user for CI commits
git config user.name "github-actions[bot]" || true
git config user.email "41898282+github-actions[bot]@users.noreply.github.com" || true

git commit -m "chore(deploy): set site version $VERSION" || { echo "No changes to commit"; }
git push origin main

echo "Deployed version $VERSION"

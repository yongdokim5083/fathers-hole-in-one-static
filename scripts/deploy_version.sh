#!/usr/bin/env bash
set -euo pipefail
# Generate deploy-ready files from templates using the current commit hash.
# The files are written only in the Actions runner and uploaded as a Pages artifact.

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
fi

echo "Generated site version $VERSION"

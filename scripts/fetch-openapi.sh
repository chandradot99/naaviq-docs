#!/usr/bin/env bash
# Pull the OpenAPI spec from the naaviq-voice-providers FastAPI app
# and write it to fern/openapi/openapi.yml.
#
# Usage:
#   ./scripts/fetch-openapi.sh local       # http://localhost:8000
#   ./scripts/fetch-openapi.sh prod        # https://naaviq-voice-providers-production.up.railway.app
#   ./scripts/fetch-openapi.sh <url>       # custom base URL

set -euo pipefail

TARGET="${1:-local}"

case "$TARGET" in
  local) BASE_URL="http://localhost:8000" ;;
  prod)  BASE_URL="https://naaviq-voice-providers-production.up.railway.app" ;;
  *)     BASE_URL="$TARGET" ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE="$SCRIPT_DIR/../fern/apis/registry/openapi.yml"

echo "→ Fetching OpenAPI spec from $BASE_URL/openapi.json"

# FastAPI serves JSON; Fern is happy with either JSON or YAML.
# We write as YAML for readable diffs.
if ! command -v yq >/dev/null 2>&1; then
  echo "  (yq not found — writing raw JSON to openapi.json instead)"
  OUT_FILE="${OUT_FILE%.yml}.json"
  curl -fsSL "$BASE_URL/openapi.json" -o "$OUT_FILE"
else
  curl -fsSL "$BASE_URL/openapi.json" | yq -P > "$OUT_FILE"
fi

echo "✓ Wrote $OUT_FILE"
echo ""
echo "Next: preview with"
echo "  fern docs dev"

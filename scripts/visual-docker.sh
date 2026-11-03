#!/usr/bin/env bash
# Runs the visual regression tests in Playwright's official Linux Docker image, the same environment
# the CI compares in, so baselines generated on any machine match CI pixel for pixel.
#
# Usage:
#   scripts/visual-docker.sh                                   # compare, Chromium and Firefox
#   scripts/visual-docker.sh --update                          # (re)generate the Linux baselines
#   scripts/visual-docker.sh visual-chromium                   # only the given project(s)
#   scripts/visual-docker.sh --update visual-firefox
#
# WebKit is left out by default: it renders blank or broken screenshots on Linux.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The image version has to match @playwright/test, so it is read from package.json
PLAYWRIGHT_VERSION="$(node -p "require('$ROOT_DIR/package.json').devDependencies['@playwright/test']")"
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

UPDATE_FLAG=""
if [[ "${1:-}" == "--update" ]]; then
  # "all" rewrites every baseline; the default only rewrites those that differ beyond the tolerance,
  # which would keep small leftovers (e.g. a removed overlay) in the baselines
  UPDATE_FLAG="--update-snapshots=all"
  shift
fi

if [[ $# -eq 0 ]]; then
  PROJECTS=("visual-chromium" "visual-firefox")
else
  PROJECTS=("$@")
fi

PROJECT_FLAGS=""
for project in "${PROJECTS[@]}"; do
  PROJECT_FLAGS+=" --project=$project"
done

if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker and try again." >&2
  exit 1
fi

echo "Image:    $IMAGE (linux/amd64, as on GitHub's runners)"
echo "Projects: ${PROJECTS[*]}"
echo "Mode:     ${UPDATE_FLAG:+update baselines}${UPDATE_FLAG:-compare with baselines}"
echo ""

# The project is mounted into the container; its node_modules come from a separate volume, because the
# ones on the host are built for the host's system. Install scripts are off: the todo backend isn't needed.
docker run --rm \
  --platform linux/amd64 \
  --ipc=host \
  -v "$ROOT_DIR:/work" \
  -v visual-tests-node-modules:/work/node_modules \
  -w /work \
  -e CI=true \
  -e NPM_CONFIG_IGNORE_SCRIPTS=true \
  "$IMAGE" \
  bash -c "npm ci --no-audit --no-fund --loglevel=error && npx playwright test --config=playwright.visual.config.ts $UPDATE_FLAG$PROJECT_FLAGS"

if [[ -n "$UPDATE_FLAG" ]]; then
  echo ""
  echo "Linux baselines are in tests/visual/visual.spec.ts-snapshots/linux/ - review them, then commit them."
fi

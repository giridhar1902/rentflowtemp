#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT_DIR}/apps/mobile-web"

"${ROOT_DIR}/scripts/mobile/cap-sync.sh" prod

KEYSTORE_FILE="${APP_DIR}/android/keystore.properties"
if [[ ! -f "${KEYSTORE_FILE}" ]]; then
  echo "Missing ${KEYSTORE_FILE}. Copy keystore.properties.example and fill release secrets." >&2
  exit 1
fi

cd "${APP_DIR}/android"
./gradlew clean bundleRelease

echo "Android AAB output: ${APP_DIR}/android/app/build/outputs/bundle/release/app-release.aab"

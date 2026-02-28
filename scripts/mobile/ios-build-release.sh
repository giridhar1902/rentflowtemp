#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT_DIR}/apps/mobile-web"
IOS_DIR="${APP_DIR}/ios/App"
ARCHIVE_PATH="${IOS_DIR}/output/RentFlow.xcarchive"
EXPORT_PATH="${IOS_DIR}/output/release"
EXPORT_OPTIONS_PLIST="${IOS_DIR}/ExportOptions.release.plist"

"${ROOT_DIR}/scripts/mobile/cap-sync.sh" prod

if [[ ! -f "${EXPORT_OPTIONS_PLIST}" ]]; then
  echo "Missing ${EXPORT_OPTIONS_PLIST}. Create export options before running release export." >&2
  exit 1
fi

mkdir -p "${IOS_DIR}/output"

xcodebuild \
  -project "${IOS_DIR}/App.xcodeproj" \
  -scheme App \
  -configuration Release \
  -archivePath "${ARCHIVE_PATH}" \
  clean archive

xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}"

echo "iOS release export output: ${EXPORT_PATH}"

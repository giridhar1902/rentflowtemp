#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT_DIR}/apps/mobile-web"
ENV_TARGET="${1:-dev}"

if [[ "${ENV_TARGET}" != "dev" && "${ENV_TARGET}" != "prod" ]]; then
  echo "Invalid target '${ENV_TARGET}'. Use 'dev' or 'prod'." >&2
  exit 1
fi

ENV_FILE="${APP_DIR}/.env.mobile.${ENV_TARGET}"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy from .env.mobile.${ENV_TARGET}.example first." >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

cd "${APP_DIR}"
npm run build:mobile
npx cap sync

echo "Capacitor sync completed for ${ENV_TARGET}."

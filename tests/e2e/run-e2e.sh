#!/usr/bin/env bash
# Usage: BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_TEST_PASSWORD=... ./run-e2e.sh

set -euo pipefail
export PLAYWRIGHT_HEADLESS=1
npx playwright test --project=chromium --reporter=list

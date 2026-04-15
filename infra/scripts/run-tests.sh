#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
pnpm test
cd apps/api && uv run pytest

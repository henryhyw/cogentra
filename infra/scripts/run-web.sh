#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
pnpm --filter @oralv/web dev

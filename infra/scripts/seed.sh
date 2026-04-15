#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../../apps/api"
uv run python -m oralv.scripts.seed_demo

#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../../apps/api"
uv run uvicorn oralv.main:app --reload --host 0.0.0.0 --port 8000

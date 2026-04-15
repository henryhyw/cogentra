#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../../apps/api"
uv run alembic upgrade head

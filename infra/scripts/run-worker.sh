#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../../apps/api"
uv run celery -A oralv.worker_app.celery_app worker --loglevel=info -Q ingest,plan,session,evidence,maintenance

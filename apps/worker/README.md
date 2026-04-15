# Oral Verification OS Worker

This app directory documents the dedicated background-processing entrypoint for Celery workers.

The actual domain logic lives in `apps/api/oralv`, and the worker container runs:

```bash
uv run celery -A oralv.worker_app.celery_app worker --loglevel=info -Q ingest,plan,session,evidence,maintenance
```

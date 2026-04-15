# Deployment

Local development is Docker-first:

- `caddy`
- `web`
- `api`
- `worker`
- `postgres`
- `redis`
- `minio`

Production deployment assumptions:

1. Reverse proxy or edge layer fronts web and API on the same origin.
2. Postgres runs with `pgvector` enabled.
3. Redis is shared by Celery and rate-limit caches.
4. Object storage is S3-compatible.
5. Secrets are injected through environment variables.

Recommended rollout:

1. Apply migrations.
2. Provision bucket and storage credentials.
3. Deploy API and worker together.
4. Deploy web after API health passes.
5. Run seed/demo import only in non-production environments.

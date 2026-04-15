# Oral Verification OS

Oral Verification OS is a reviewer-first SaaS platform for transforming assignment context, rubric criteria, and student submissions into structured asynchronous oral verification workflows.

## Stack

- Monorepo: `pnpm` workspaces + Turborepo
- Web: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- API: FastAPI, SQLAlchemy 2.0, Pydantic, Alembic
- Worker: Celery + Redis
- Data: PostgreSQL 16 + pgvector, Redis, MinIO

## Quick Start

1. Copy `.env.example` to `.env` and adjust secrets if needed.
2. Run `make bootstrap`.
3. Run `make docker-up`.
4. Visit `http://localhost`.

For local non-Docker development:

1. Start infrastructure with `docker compose up postgres redis minio minio-init -d`.
2. Run `make api` and `make worker`.
3. Run `make web`.

## Default Demo Credentials

- Owner: `owner@northstar.ac` / `ChangeMe123!`
- Reviewer: `reviewer@northstar.ac` / `ChangeMe123!`
- Admin: `admin@northstar.ac` / `ChangeMe123!`

## Commands

- `make dev`: run the monorepo in dev mode
- `make migrate`: apply database migrations
- `make seed`: load sample organizations, cases, sessions, and evidence
- `make test`: run frontend and backend unit/integration tests
- `make e2e`: run Playwright coverage

## Documentation

- [architecture.md](./architecture.md)
- [product-overview.md](./product-overview.md)
- [ai-pipeline.md](./ai-pipeline.md)
- [api-spec.md](./api-spec.md)
- [deployment.md](./deployment.md)

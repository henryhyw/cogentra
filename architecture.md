# Architecture

Oral Verification OS is organized as a modular monorepo:

- `apps/web`: Next.js reviewer and student experience
- `apps/api`: FastAPI application, domain services, migrations, and seed scripts
- `apps/worker`: Celery entrypoints for asynchronous orchestration
- `packages/ui`: shared design system components and presentation helpers
- `packages/config`: shared TypeScript, ESLint, and frontend test configuration
- `packages/types`: shared API contracts and enums generated from backend schemas

Core runtime topology:

1. Caddy terminates local HTTP traffic and keeps `/api` same-origin.
2. Next.js renders the reviewer and student experiences.
3. FastAPI owns auth, tenancy, core business logic, storage, audit, and AI orchestration.
4. Celery workers execute ingestion, planning, session, and evidence synthesis jobs.
5. PostgreSQL stores transactional data and vector embeddings.
6. Redis backs queues, rate limits, and short-lived workflow state.
7. MinIO stores uploaded artifacts, recordings, exports, and generated derivatives.

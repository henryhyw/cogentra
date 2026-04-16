# Concentra

Concentra is a submission-aware oral verification platform for assignment review. It ingests assignment artifacts and student submissions, turns them into assignment-scoped student cases, generates targeted oral verification questions, captures async responses, and synthesizes reviewer-ready evidence packages with focus-point status, inconsistency flags, and source-linked rationale.

The prototype in this repo is built as a reviewer-first product, not an LMS or a chatbot wrapper. Everything is assignment-centric: assignment artifacts, student imports, case generation, session links, and review all stay inside the assignment workspace.

## Architecture

Repo layout:

- `apps/web`: Next.js App Router frontend with Tailwind, Framer Motion, and shadcn-style UI primitives
- `apps/api`: FastAPI backend with typed models, provider abstractions, and deterministic demo mode
- `packages/ui`: shared design system and product components
- `packages/schemas`: shared Zod contracts for frontend data shapes
- `packages/config`: shared env parsing and product constants
- `demo-data`: seed notes, generated artifact mirrors, and minimal e2e upload fixtures

Backend runtime modes:

- `demo`: JSON-backed seeded datastore, deterministic AI provider, deterministic speech provider, local storage, local queue
- `google`: Firestore repository, Vertex AI provider, Google Speech-to-Text, GCS storage, Cloud Tasks adapter, Firebase Auth token verification
- `auto`: choose `google` only when the required Google credentials are present, otherwise fall back to `demo`

## Product Surfaces

Teacher / reviewer routes:

- `/login`
- `/assignments?view=dashboard`
- `/assignments?view=list`
- `/assignments/[assignmentId]`
- `/cases/[caseId]/review`
- `/settings`

Student routes:

- `/session/[sessionToken]`
- `/session/[sessionToken]/complete`

## Local Development

Prerequisites:

- Node 22+
- pnpm 10+
- Python 3.12+
- uv

Install frontend deps:

```bash
pnpm install
```

Sync API deps:

```bash
uv sync --project apps/api --extra test
```

Copy env examples:

```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
```

Seed demo data:

```bash
pnpm seed
```

Run the backend:

```bash
pnpm dev:api
```

Run the frontend:

```bash
pnpm dev:web
```

Run both together:

```bash
pnpm dev
```

## Demo Mode

Demo mode is the default when Google credentials are absent.

What demo mode includes:

- three seeded assignments with realistic artifacts
- five student bundles per assignment
- pre-generated focus points and question sets
- a mix of completed, pending-review, and already-reviewed cases
- deterministic session transcription behavior for newly recorded demo answers
- generated artifact mirrors under `demo-data/generated/` after seeding

Demo login:

- open `/login`
- click `Try demo workspace`

## Real Google Mode

To run against Google services, set the required env vars in the root and API env files:

- `CONCENTRA_MODE=google`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `VERTEX_PROJECT_ID`
- `VERTEX_LOCATION`
- `VERTEX_MODEL_TEXT`
- `VERTEX_MODEL_MULTIMODAL`
- `GCS_BUCKET`
- `CLOUD_TASKS_PROJECT_ID`
- `CLOUD_TASKS_LOCATION`
- `CLOUD_TASKS_QUEUE`
- `GOOGLE_APPLICATION_CREDENTIALS`

The backend service constructor switches automatically between demo and Google-backed providers via `settings.resolved_mode`.

## Scripts

- `pnpm dev`: run web and API together
- `pnpm dev:web`: run the Next.js app
- `pnpm dev:api`: run the FastAPI app
- `pnpm build`: build the frontend
- `pnpm test`: run API and web tests
- `pnpm test:api`: run FastAPI tests
- `pnpm test:web`: run Vitest tests
- `pnpm test:e2e`: run Playwright tests
- `pnpm seed`: rebuild the deterministic demo dataset
- `pnpm reset-demo`: reset runtime data and reseed

## Tests

Backend tests currently cover:

- deterministic section extraction and artifact classification
- seeded dataset availability
- full API workflow:
  create assignment -> upload artifact -> analyze -> import student files -> create case -> open session -> submit responses -> complete session -> view result -> save reviewer note -> mark reviewed

Run them with:

```bash
apps/api/.venv/bin/python -m pytest apps/api/tests -q
```

Frontend tests included:

- `apps/web/tests/contracts.test.ts`: schema sanity checks
- `apps/web/tests/e2e/demo-review.spec.ts`: reviewer demo flow smoke coverage

## Screenshots / Demo Capture

For screenshots or a short demo recording:

1. run `pnpm dev`
2. seed the workspace with `pnpm seed`
3. log in via `Try demo workspace`
4. record:
   - assignments dashboard/list view
   - assignment workspace import and case table
   - case review page
   - student session flow

## Notes

- The backend is verified in demo mode through the FastAPI test suite.
- Frontend dependency installation may require network access; if `pnpm install` is interrupted by registry network errors, rerun it and then run `pnpm build` or `pnpm test:web`.

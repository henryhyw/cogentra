SHELL := /bin/zsh

.PHONY: bootstrap install dev web api worker build lint typecheck test e2e docker-up docker-down migrate seed

bootstrap:
	corepack enable
	corepack prepare pnpm@10.18.3 --activate
	pnpm install
	cd apps/api && uv sync

install: bootstrap

dev:
	pnpm dev

web:
	pnpm --filter @oralv/web dev

api:
	cd apps/api && uv run uvicorn oralv.main:app --reload --host 0.0.0.0 --port 8000

worker:
	cd apps/api && uv run celery -A oralv.worker_app.celery_app worker --loglevel=info -Q ingest,plan,session,evidence,maintenance

build:
	pnpm build

lint:
	pnpm lint
	cd apps/api && uv run ruff check .

typecheck:
	pnpm typecheck
	cd apps/api && uv run mypy oralv

test:
	pnpm test
	cd apps/api && uv run pytest

e2e:
	pnpm e2e

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down --remove-orphans

migrate:
	cd apps/api && uv run alembic upgrade head

seed:
	cd apps/api && uv run python -m oralv.scripts.seed_demo

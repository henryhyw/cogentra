#!/usr/bin/env sh
set -eu

corepack enable
corepack prepare pnpm@10.18.3 --activate
pnpm install
cd apps/api && uv sync

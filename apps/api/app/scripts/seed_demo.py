from __future__ import annotations

import argparse

from app.config import get_settings
from app.services.seed import DemoSeedBuilder


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Concentra demo data.")
    parser.add_argument("--reset", action="store_true", help="Reset runtime data before seeding.")
    args = parser.parse_args()

    settings = get_settings()
    builder = DemoSeedBuilder(settings)
    if args.reset:
        builder.reset_runtime()
    dataset = builder.build()
    target = builder.write_store(dataset)
    print(f"Seeded demo dataset at {target}")


if __name__ == "__main__":
    main()

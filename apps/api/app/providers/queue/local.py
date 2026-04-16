from __future__ import annotations

from app.providers.queue.base import QueueProvider


class LocalQueueProvider(QueueProvider):
    def enqueue(self, *, task_name: str, payload: dict) -> None:
        # Demo mode executes processing inline; the queue interface still exists
        # so production providers can schedule the same payloads asynchronously.
        return None

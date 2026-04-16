from __future__ import annotations

import json

from app.config import Settings
from app.providers.queue.base import QueueProvider
from app.providers.queue.local import LocalQueueProvider


class CloudTasksQueueProvider(QueueProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        self._fallback = LocalQueueProvider()
        try:
            from google.cloud import tasks_v2
        except Exception:  # pragma: no cover
            self._client = None
            self._queue_path = None
        else:
            self._client = tasks_v2.CloudTasksClient()
            if settings.cloud_tasks_project_id and settings.cloud_tasks_location and settings.cloud_tasks_queue:
                self._queue_path = self._client.queue_path(
                    settings.cloud_tasks_project_id,
                    settings.cloud_tasks_location,
                    settings.cloud_tasks_queue,
                )
            else:
                self._queue_path = None

    def enqueue(self, *, task_name: str, payload: dict) -> None:
        if not self._client or not self._queue_path:
            self._fallback.enqueue(task_name=task_name, payload=payload)
            return
        from google.cloud import tasks_v2

        task = tasks_v2.Task(
            http_request=tasks_v2.HttpRequest(
                http_method=tasks_v2.HttpMethod.POST,
                url=f"{self.settings.app_base_url}/internal/tasks/{task_name}",
                headers={"Content-Type": "application/json"},
                body=json.dumps(payload).encode("utf-8"),
            )
        )
        self._client.create_task(parent=self._queue_path, task=task)

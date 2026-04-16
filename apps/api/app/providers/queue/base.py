from __future__ import annotations

from abc import ABC, abstractmethod


class QueueProvider(ABC):
    @abstractmethod
    def enqueue(self, *, task_name: str, payload: dict) -> None:
        raise NotImplementedError

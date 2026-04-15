from celery import Celery

from oralv.config import get_settings

settings = get_settings()

celery_app = Celery("oralv", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    task_always_eager=settings.task_always_eager,
)
celery_app.autodiscover_tasks(["oralv"])

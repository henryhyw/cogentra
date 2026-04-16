from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import assignments, auth, cases, dashboard, session, settings as settings_router, uploads

settings = get_settings()

app = FastAPI(title="Concentra API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth.router,
    dashboard.router,
    assignments.router,
    cases.router,
    session.router,
    settings_router.router,
    uploads.router,
]:
    app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "mode": settings.resolved_mode}


@app.exception_handler(KeyError)
async def handle_key_error(_, exc: KeyError):
    detail = str(exc).strip("'")
    status = 404 if detail.endswith("_not_found") or detail == "session_not_found" else 400
    return JSONResponse(status_code=status, content={"detail": detail})


@app.exception_handler(ValueError)
async def handle_value_error(_, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

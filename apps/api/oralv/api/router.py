from fastapi import APIRouter

from oralv.api.routes import analytics, audit, auth, cases, decisions, members, plans, sessions, templates

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["decisions"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

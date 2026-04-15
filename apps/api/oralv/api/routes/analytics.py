from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth
from oralv.db import get_db
from oralv.services.analytics import overview

router = APIRouter()


@router.get("/overview")
def analytics_overview(context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    return overview(db, context.organization_id)

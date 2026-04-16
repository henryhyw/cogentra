from __future__ import annotations

from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from app.deps import get_service
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["uploads"])


@router.put("/uploads/{upload_id}")
async def put_upload(
    upload_id: str,
    request: Request,
    storage_path: str,
    service: ConcentraService = Depends(get_service),
) -> dict:
    _ = upload_id
    raw = await request.body()
    service.save_uploaded_bytes(unquote(storage_path), raw)
    return {"ok": True, "storagePath": unquote(storage_path)}


@router.get("/files/{storage_path:path}")
def get_file(storage_path: str, service: ConcentraService = Depends(get_service)) -> FileResponse:
    path = service.storage.local_path_for(storage_path)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="file_not_found")
    return FileResponse(path)

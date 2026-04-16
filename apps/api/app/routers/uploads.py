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
    resolved_path = unquote(storage_path)
    local_path = service.storage.local_path_for(resolved_path)
    if local_path is not None:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with local_path.open("wb") as handle:
            async for chunk in request.stream():
                if chunk:
                    handle.write(chunk)
        return {"ok": True, "storagePath": resolved_path}

    raw = bytearray()
    async for chunk in request.stream():
        if chunk:
            raw.extend(chunk)
    service.save_uploaded_bytes(resolved_path, bytes(raw))
    return {"ok": True, "storagePath": resolved_path}


@router.get("/files/{storage_path:path}")
def get_file(storage_path: str, service: ConcentraService = Depends(get_service)) -> FileResponse:
    path = service.storage.local_path_for(storage_path)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="file_not_found")
    return FileResponse(path)

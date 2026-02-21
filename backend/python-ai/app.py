import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Auto Market AI (Minimal)")

class PipelineRequest(BaseModel):
    imagePaths: List[str]

def safe_open_image(path: str) -> Optional[Image.Image]:
    try:
        return Image.open(path)
    except Exception:
        return None

@app.post("/pipeline")
def pipeline(req: PipelineRequest) -> Dict[str, Any]:
    # Security note: in production, validate that paths are inside an allowed upload directory.
    # Here we do a minimal validation to avoid obvious abuse.
    allowed_root = os.path.abspath(os.getenv("UPLOAD_DIR", os.getcwd()))
    opened = 0
    for p in req.imagePaths:
        ap = os.path.abspath(p)
        if not ap.startswith(allowed_root):
            # If Node stores uploads elsewhere, set UPLOAD_DIR env accordingly for this server.
            raise HTTPException(status_code=400, detail=f"Path not allowed: {p}")
        img = safe_open_image(ap)
        if img is not None:
            opened += 1
            img.close()

    # Demo outputs (replace with real models later)
    studio = {"imagesProcessed": opened}
    damage = {"issues": ["Old bamperda tirnalish aniqlandi (python demo)"] if opened else []}
    recognition = {"query": "chevrolet malibu (python demo)", "similarIds": []}

    return {"studio": studio, "damage": damage, "recognition": recognition}

@app.get("/health")
def health():
    return {"ok": True}

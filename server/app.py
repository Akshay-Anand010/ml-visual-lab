"""CNN Studio API + optional static site.

Run from this folder:
    uvicorn app:app --reload --port 8000

GitHub Pages UI talks to this origin (set in the lab). Hugging Face / Render
can serve both the API and the ML Visual Lab files from the repo root.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from io import BytesIO
from PIL import Image

from sample import generate_samples, get_model

ROOT = Path(__file__).resolve().parent.parent
MAX_UPLOAD_MB = 8
MAX_SAMPLES = 128
MIN_SAMPLES = 50

app = FastAPI(
    title="ML Visual Lab — CNN Studio",
    description="Identity-preserving CNN views from a single photo.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _warm() -> None:
    get_model()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "cnn-studio", "max_samples": MAX_SAMPLES}


@app.post("/api/samples")
async def samples(
    file: UploadFile = File(...),
    n: int = Form(64),
    seed: int = Form(0),
) -> dict:
    ctype = (file.content_type or "").lower()
    name = (file.filename or "").lower()
    looks_image = ctype.startswith("image/") or name.endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))
    if not looks_image:
        raise HTTPException(400, "Upload an image (jpeg, png, webp).")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"Image must be under {MAX_UPLOAD_MB} MB.")
    try:
        img = Image.open(BytesIO(raw))
        img.load()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, "Could not read that image.") from exc

    n = int(n)
    if n < 1:
        raise HTTPException(400, "n must be ≥ 1")
    n = min(n, MAX_SAMPLES)

    out = generate_samples(img, n=max(n, MIN_SAMPLES) if n >= MIN_SAMPLES else n, seed=seed, max_n=MAX_SAMPLES)
    encoded = ["data:image/jpeg;base64," + base64.b64encode(b).decode("ascii") for b in out["frames"]]
    return {
        "count": out["count"],
        "requested": out["requested"],
        "latent_norm": round(out["latent_norm"], 4),
        "trained_weights": out["weights"],
        "samples": encoded,
    }


# Serve the existing GitHub Pages site when this process is the host.
if (ROOT / "index.html").exists():
    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(ROOT / "index.html")

    app.mount("/css", StaticFiles(directory=ROOT / "css"), name="css")
    app.mount("/js", StaticFiles(directory=ROOT / "js"), name="js")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)

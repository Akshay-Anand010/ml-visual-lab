"""Load the CNN, preprocess uploads, emit JPEG samples."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from model import IMG_SIZE, SampleCNN, apply_views, recommended_count, sample_params

WEIGHTS_PATH = Path(__file__).resolve().parent / "weights" / "cnn_studio.pt"
DEVICE = torch.device("cpu")

_model: SampleCNN | None = None


def get_model() -> SampleCNN:
    global _model
    if _model is None:
        m = SampleCNN()
        if WEIGHTS_PATH.exists():
            try:
                state = torch.load(WEIGHTS_PATH, map_location="cpu", weights_only=True)
            except TypeError:
                state = torch.load(WEIGHTS_PATH, map_location="cpu")
            m.load_state_dict(state, strict=False)
        m.eval()
        _model = m
    return _model


def pil_to_tensor(img: Image.Image) -> torch.Tensor:
    img = img.convert("RGB")
    # square center crop, then 64×64 for the CNN
    w, h = img.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    img = img.crop((left, top, left + s, top + s)).resize((IMG_SIZE, IMG_SIZE), Image.Resampling.LANCZOS)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)


def tensor_to_jpeg(t: torch.Tensor, size: int = 192, quality: int = 82) -> bytes:
    t = t.detach().clamp(0, 1).squeeze(0).permute(1, 2, 0).cpu().numpy()
    im = Image.fromarray((t * 255).astype(np.uint8), "RGB")
    if size != IMG_SIZE:
        im = im.resize((size, size), Image.Resampling.LANCZOS)
    buf = BytesIO()
    im.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


@torch.inference_mode()
def generate_samples(
    image: Image.Image,
    n: int = 64,
    seed: int = 0,
    max_n: int = 128,
    jpeg_size: int = 192,
) -> dict:
    model = get_model()
    x = pil_to_tensor(image).to(DEVICE)
    z, mu, std = model(x)
    n_eff = recommended_count(x, n, max_n=max_n)
    g = torch.Generator(device="cpu")
    g.manual_seed(int(seed))
    params = sample_params(mu.squeeze(0).cpu(), std.squeeze(0).cpu(), n_eff, generator=g)
    # batch in chunks so CPU stays snappy
    chunk = 16
    frames: list[bytes] = []
    x_rep_base = x.cpu()
    for i in range(0, n_eff, chunk):
        sl = params[i : i + chunk]
        xb = x_rep_base.expand(sl.size(0), -1, -1, -1)
        y = apply_views(xb, sl)
        for j in range(y.size(0)):
            frames.append(tensor_to_jpeg(y[j], size=jpeg_size))
    return {
        "count": n_eff,
        "requested": n,
        "latent_norm": float(z.norm().item()),
        "mu": mu.squeeze(0).cpu().tolist(),
        "std": std.squeeze(0).cpu().tolist(),
        "frames": frames,
        "weights": WEIGHTS_PATH.exists(),
    }

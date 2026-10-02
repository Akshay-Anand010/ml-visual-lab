"""Train SampleCNN on portraits (Colab or local).

Loss: identity views should stay close to the source after inverse-range
regularization, while sampled params should use the prior (diversity).

Usage:
    python train.py --epochs 8 --out weights/cnn_studio.pt
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset

from model import IMG_SIZE, SampleCNN, apply_views, sample_params


class ImageFolder64(Dataset):
    def __init__(self, root: Path) -> None:
        exts = {".jpg", ".jpeg", ".png", ".webp"}
        self.paths = [p for p in Path(root).rglob("*") if p.suffix.lower() in exts]
        if not self.paths:
            raise SystemExit(f"No images under {root}")

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, i: int) -> torch.Tensor:
        im = Image.open(self.paths[i]).convert("RGB")
        w, h = im.size
        s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        im = im.resize((IMG_SIZE, IMG_SIZE), Image.Resampling.LANCZOS)
        arr = np.asarray(im, dtype=np.float32) / 255.0
        return torch.from_numpy(arr).permute(2, 0, 1)


def synthetic_faces(n: int = 256) -> torch.Tensor:
    """Fallback batch if no folder is given — oval portraits for a smoke train."""
    imgs = []
    rng = np.random.default_rng(0)
    yy, xx = np.mgrid[0:IMG_SIZE, 0:IMG_SIZE]
    cy, cx = IMG_SIZE / 2, IMG_SIZE / 2
    for _ in range(n):
        skin = rng.uniform(0.45, 0.9, size=3)
        bg = rng.uniform(0.05, 0.35, size=3)
        img = np.tile(bg, (IMG_SIZE, IMG_SIZE, 1))
        face = ((xx - cx) / (IMG_SIZE * 0.28)) ** 2 + ((yy - cy) / (IMG_SIZE * 0.34)) ** 2 < 1
        img[face] = skin
        ey = int(cy - 6)
        for ex in (int(cx - 8), int(cx + 8)):
            eye = (xx - ex) ** 2 + (yy - ey) ** 2 < 9
            img[eye] = skin * 0.25
        mouth = (np.abs(yy - (cy + 10)) < 2) & (np.abs(xx - cx) < 8)
        img[mouth] = skin * 0.4
        imgs.append(img)
    t = torch.from_numpy(np.stack(imgs).astype(np.float32)).permute(0, 3, 1, 2)
    return t


def train(args: argparse.Namespace) -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SampleCNN().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)

    loader = None
    if args.data:
        ds = ImageFolder64(Path(args.data))
        loader = DataLoader(ds, batch_size=args.batch, shuffle=True, drop_last=True, num_workers=0)

    model.train()
    step = 0
    for epoch in range(args.epochs):
        if loader is None:
            batches = [synthetic_faces(args.batch) for _ in range(20)]
        else:
            batches = loader
        for x in batches:
            x = x.to(device)
            z, mu, std = model(x)
            params = sample_params(mu, std, x.size(0))
            y = apply_views(x, params)
            rec = F.l1_loss(y, x)
            # keep predicted mean near 0 (identity) and std near the calibrated prior
            mean_reg = mu.square().mean()
            std_reg = (std.mean() - 0.08).square()
            z_reg = 1e-4 * z.square().mean()
            loss = rec + 0.15 * mean_reg + 0.05 * std_reg + z_reg
            opt.zero_grad()
            loss.backward()
            opt.step()
            step += 1
            if step % 20 == 0:
                print(f"epoch {epoch+1} step {step} loss={loss.item():.4f} rec={rec.item():.4f}")
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.cpu().state_dict(), out)
    print(f"wrote {out} ({out.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=str, default="", help="Folder of portraits (optional)")
    p.add_argument("--epochs", type=int, default=6)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--out", type=str, default="weights/cnn_studio.pt")
    train(p.parse_args())

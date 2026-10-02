"""Lightweight identity-preserving CNN for face/view sampling.

The network is a tiny encoder + parameter head (SampleCNN). It maps a
64×64 RGB crop to a latent code z, then to a distribution over spatial /
photometric transforms. Samples are the *original pixels* warped by a
spatial transformer CNN — identity stays intact, views change.

After Colab training, the head learns safer ranges (e.g. less translation
when the face sits near an edge). Untrained, calibrated biases still
produce diverse, usable views.
"""

from __future__ import annotations

import math
from typing import Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

IMG_SIZE = 64
LATENT_DIM = 32
# affine: rot, scale, tx, ty, shear  | color: b, c, s, h | warp amp
N_PARAMS = 10


def conv_block(cin: int, cout: int, stride: int = 2) -> nn.Sequential:
    return nn.Sequential(
        nn.Conv2d(cin, cout, 3, stride=stride, padding=1, bias=False),
        nn.BatchNorm2d(cout),
        nn.SiLU(inplace=True),
    )


class SampleCNN(nn.Module):
    """~180k params. Fast on CPU. Encoder → μ, logσ of transform params."""

    def __init__(self, latent_dim: int = LATENT_DIM) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            conv_block(3, 24, 2),  # 32
            conv_block(24, 48, 2),  # 16
            conv_block(48, 72, 2),  # 8
            conv_block(72, 96, 2),  # 4
            nn.AdaptiveAvgPool2d(1),
        )
        self.to_z = nn.Linear(96, latent_dim)
        self.head = nn.Sequential(
            nn.SiLU(),
            nn.Linear(latent_dim, 64),
            nn.SiLU(),
            nn.Linear(64, N_PARAMS * 2),  # mu || log_std
        )
        self._calibrate()

    def _calibrate(self) -> None:
        last = self.head[-1]
        nn.init.zeros_(last.weight)
        # Conservative prior so untrained weights already look like view changes.
        mu = torch.zeros(N_PARAMS)
        log_std = torch.tensor(
            [
                math.log(0.12),  # rotation (rad) ~ ±7°
                math.log(0.06),  # scale delta
                math.log(0.06),  # tx
                math.log(0.06),  # ty
                math.log(0.05),  # shear
                math.log(0.12),  # brightness
                math.log(0.12),  # contrast
                math.log(0.10),  # saturation
                math.log(0.08),  # hue
                math.log(0.035),  # warp
            ]
        )
        with torch.no_grad():
            last.bias.copy_(torch.cat([mu, log_std]))

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        h = self.encoder(x).flatten(1)
        return self.to_z(h)

    def param_dist(self, z: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        raw = self.head(z)
        mu, log_std = raw.chunk(2, dim=-1)
        std = F.softplus(log_std) + 1e-3
        return mu, std

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        z = self.encode(x)
        mu, std = self.param_dist(z)
        return z, mu, std


def _affine_matrix(p: torch.Tensor) -> torch.Tensor:
    """p: (B, 5) rot, scale_delta, tx, ty, shear → (B, 2, 3)."""
    rot = p[:, 0].clamp(-0.45, 0.45)
    scale = (1.0 + p[:, 1]).clamp(0.82, 1.18)
    tx = p[:, 2].clamp(-0.18, 0.18)
    ty = p[:, 3].clamp(-0.18, 0.18)
    shear = p[:, 4].clamp(-0.18, 0.18)
    cos, sin = torch.cos(rot), torch.sin(rot)
    a = scale * (cos + shear * sin)
    b = scale * (-sin + shear * cos)
    c = scale * sin
    d = scale * cos
    row1 = torch.stack([a, b, tx], dim=1)
    row2 = torch.stack([c, d, ty], dim=1)
    return torch.stack([row1, row2], dim=1)


def _color_jitter(x: torch.Tensor, p: torch.Tensor) -> torch.Tensor:
    b = p[:, 5].clamp(-0.35, 0.35)[:, None, None, None]
    c = (1.0 + p[:, 6].clamp(-0.35, 0.35))[:, None, None, None]
    s = (1.0 + p[:, 7].clamp(-0.35, 0.35))[:, None, None, None]
    h = p[:, 8].clamp(-0.25, 0.25)
    x = ((x - 0.5) * c + 0.5 + b).clamp(0, 1)
    gray = x.mean(1, keepdim=True)
    x = (gray + (x - gray) * s).clamp(0, 1)
    # cheap hue: mix channels
    r, g, bl = x[:, 0], x[:, 1], x[:, 2]
    cr = torch.cos(h)
    sr = torch.sin(h)
    r2 = cr * r + sr * g
    g2 = -sr * r + cr * g
    x = torch.stack([r2, g2, bl], dim=1).clamp(0, 1)
    return x


def _elastic_grid(grid: torch.Tensor, amp: torch.Tensor) -> torch.Tensor:
    """Low-frequency warp on the sampling grid. amp: (B,)."""
    b, h, w, _ = grid.shape
    yy = torch.linspace(0, 3.1416, h, device=grid.device)
    xx = torch.linspace(0, 3.1416, w, device=grid.device)
    gy, gx = torch.meshgrid(yy, xx, indexing="ij")
    phase = amp.view(b, 1, 1)
    dx = 0.55 * phase * torch.sin(2 * gy) * torch.cos(gx)
    dy = 0.55 * phase * torch.cos(gy) * torch.sin(2 * gx)
    warp = torch.stack([dx, dy], dim=-1)
    return grid + warp


def apply_views(x: torch.Tensor, params: torch.Tensor) -> torch.Tensor:
    """Differentiable CNN sampling of identity-preserving views."""
    theta = _affine_matrix(params)
    grid = F.affine_grid(theta, size=x.size(), align_corners=False)
    amp = params[:, 9].clamp(-0.12, 0.12)
    grid = _elastic_grid(grid, amp)
    y = F.grid_sample(x, grid, mode="bilinear", padding_mode="border", align_corners=False)
    return _color_jitter(y, params)


def sample_params(mu: torch.Tensor, std: torch.Tensor, n: int, generator=None) -> torch.Tensor:
    """Draw n transform vectors. Broadcasts a single-image dist to n samples."""
    if mu.dim() == 1:
        mu = mu.unsqueeze(0)
        std = std.unsqueeze(0)
    mu = mu.expand(n, -1)
    std = std.expand(n, -1)
    eps = torch.randn(n, mu.size(-1), device=mu.device, generator=generator)
    return mu + std * eps


def recommended_count(x: torch.Tensor, requested: int, max_n: int = 128, min_n: int = 50) -> int:
    """Cap sample count from image sharpness + structure (fast, no extra net)."""
    gray = x.mean(dim=1, keepdim=True)
    kx = torch.tensor([[[[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]]], device=x.device, dtype=x.dtype)
    ky = torch.tensor([[[[-1, -2, -1], [0, 0, 0], [1, 2, 1]]]], device=x.device, dtype=x.dtype)
    gx = F.conv2d(gray, kx, padding=1)
    gy = F.conv2d(gray, ky, padding=1)
    sharp = (gx.square() + gy.square()).mean().item()
    # center mass: more budget if energy is concentrated (typical portrait)
    b, _, h, w = x.shape
    yy = torch.linspace(-1, 1, h, device=x.device).view(1, 1, h, 1)
    xx = torch.linspace(-1, 1, w, device=x.device).view(1, 1, 1, w)
    weight = torch.exp(-2.2 * (xx.square() + yy.square()))
    lum = gray.clamp(0, 1)
    center = (lum * weight).mean().item() / (weight.mean().item() + 1e-6)
    budget = int(50 + min(80, sharp * 400) + min(40, center * 50))
    n = min(requested, budget, max_n)
    return max(min_n, n) if requested >= min_n else max(1, min(requested, max_n))

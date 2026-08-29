import { labShell, setupCanvas } from "../ui.js";

const KERNELS = {
  edge: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  sobelX: [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  blur: [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ].map((r) => r.map((v) => v / 16)),
  identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

function makeImage() {
  const n = 12;
  const g = Array.from({ length: n }, () => Array(n).fill(0.08));
  for (let i = 2; i < 10; i++) {
    g[i][3] = 0.95;
    g[i][8] = 0.95;
  }
  for (let j = 3; j <= 8; j++) g[9][j] = 0.95;
  g[3][4] = 0.9;
  g[3][7] = 0.9;
  return g;
}

function convAt(img, k, y, x) {
  let s = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy;
      const xx = x + dx;
      if (yy < 0 || xx < 0 || yy >= img.length || xx >= img[0].length) continue;
      s += img[yy][xx] * k[dy + 1][dx + 1];
    }
  }
  return s;
}

function relu(v) {
  return Math.max(0, v);
}

function pool2(map) {
  const o = [];
  for (let y = 0; y < map.length; y += 2) {
    const row = [];
    for (let x = 0; x < map[0].length; x += 2) {
      row.push(
        Math.max(
          map[y][x],
          map[y][x + 1] ?? 0,
          map[y + 1]?.[x] ?? 0,
          map[y + 1]?.[x + 1] ?? 0
        )
      );
    }
    o.push(row);
  }
  return o;
}

export function mountCnn(root) {
  const { canvas } = labShell(root, {
    title: "Convolution",
    kicker: "Sliding kernel",
    body: "A CNN does not look at a whole image at once. A tiny filter (kernel) slides across pixels. At each stop it computes a weighted mix — that is one cell of the feature map. ReLU zeros negatives; max-pool keeps the strongest response in each 2×2 block.",
    formula: "s[i,j] = Σ Σ K[u,v] · X[i+u, j+v]\nA = ReLU(s)   then  2×2 max-pool",
    controlsHtml: `
      <label class="ctrl">Kernel
        <select id="kname">
          <option value="edge">Edge detect</option>
          <option value="sobelX">Vertical edges (Sobel)</option>
          <option value="blur">Blur</option>
          <option value="identity">Identity</option>
        </select>
      </label>
      <div class="btn-row">
        <button id="play">Play scan</button>
        <button class="ghost" id="step">Step</button>
        <button class="ghost" id="reset">Reset scan</button>
      </div>
      <p class="explain">The gold square is the kernel. The map on the right fills in as it moves.</p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const img = makeImage();
  let kernel = KERNELS.edge;
  let cy = 0;
  let cx = 0;
  let playing = true;
  let fmap = img.map((r) => r.map(() => null));

  function fullMap() {
    return img.map((row, y) => row.map((_, x) => relu(convAt(img, kernel, y, x))));
  }

  function drawGrid(originX, originY, cell, grid, highlight, title) {
    ctx.fillStyle = "#9a948a";
    ctx.font = "13px Source Sans 3, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, originX, originY - 10);
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const v = grid[y][x];
        const val = v == null ? 0.05 : Math.min(1, Math.abs(v));
        ctx.fillStyle = `rgb(${20 + val * 180},${30 + val * 200},${40 + val * 160})`;
        ctx.fillRect(originX + x * cell, originY + y * cell, cell - 1, cell - 1);
      }
    }
    if (highlight) {
      ctx.strokeStyle = "#d4a574";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        originX + (highlight.x - 1) * cell,
        originY + (highlight.y - 1) * cell,
        cell * 3,
        cell * 3
      );
    }
  }

  function draw() {
    const { w, h } = cssSize();
    ctx.clearRect(0, 0, w, h);
    const cell = Math.min(22, (h - 80) / 14);
    drawGrid(24, 40, cell, img, { x: cx, y: cy }, "input");
    const shown = fmap.map((r, y) =>
      r.map((v, x) => {
        if (y < cy || (y === cy && x <= cx)) return v ?? 0;
        return null;
      })
    );
    drawGrid(24 + cell * 14, 40, cell, shown, null, "feature map (ReLU)");
    const pooled = pool2(fullMap());
    const pcell = cell * 1.6;
    drawGrid(24 + cell * 28, 40, pcell, pooled, null, "max-pool 2×2");

    ctx.fillStyle = "#9a948a";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText("kernel 3×3", 24, h - 78);
    kernel.forEach((row, y) => {
      row.forEach((v, x) => {
        ctx.fillStyle = v >= 0 ? "rgba(110,224,196,0.85)" : "rgba(239,123,108,0.85)";
        ctx.fillRect(24 + x * 36, h - 68 + y * 20, 34, 18);
        ctx.fillStyle = "#0b0d10";
        ctx.textAlign = "left";
        ctx.fillText(String(v.toFixed(1)), 28 + x * 36, h - 54 + y * 20);
      });
    });
  }

  function stepScan() {
    fmap[cy][cx] = relu(convAt(img, kernel, cy, cx));
    cx += 1;
    if (cx >= img[0].length) {
      cx = 0;
      cy += 1;
    }
    if (cy >= img.length) {
      cy = 0;
      cx = 0;
      playing = false;
    }
  }

  root.querySelector("#kname").onchange = (e) => {
    kernel = KERNELS[e.target.value];
    fmap = img.map((r) => r.map(() => null));
    cy = 0;
    cx = 0;
    playing = true;
  };
  root.querySelector("#play").onclick = () => {
    playing = !playing;
    root.querySelector("#play").textContent = playing ? "Pause" : "Play scan";
  };
  root.querySelector("#step").onclick = () => {
    playing = false;
    stepScan();
  };
  root.querySelector("#reset").onclick = () => {
    fmap = img.map((r) => r.map(() => null));
    cy = 0;
    cx = 0;
    playing = true;
  };

  let raf;
  let acc = 0;
  let prev = performance.now();
  const loop = (now) => {
    acc += now - prev;
    prev = now;
    if (playing && acc > 70) {
      acc = 0;
      stepScan();
    }
    draw();
    raf = requestAnimationFrame(loop);
  };
  loop(prev);
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

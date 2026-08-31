import { labShell, setupCanvas, paintStage } from "../ui.js";

function makeCloud(n, stretch, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u = (Math.random() - 0.5) * stretch;
    const v = (Math.random() - 0.5) * 0.55;
    pts.push({ x: c * u - s * v, y: s * u + c * v });
  }
  return pts;
}

function pca(pts) {
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  pts.forEach((p) => {
    const dx = p.x - mx;
    const dy = p.y - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  });
  cxx /= n;
  cyy /= n;
  cxy /= n;
  const tr = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  let v1x = cxy;
  let v1y = l1 - cxx;
  if (Math.hypot(v1x, v1y) < 1e-8) {
    v1x = l1 - cyy;
    v1y = cxy;
  }
  const n1 = Math.hypot(v1x, v1y) || 1;
  v1x /= n1;
  v1y /= n1;
  const v2x = -v1y;
  const v2y = v1x;
  const tot = l1 + l2 || 1;
  return { mx, my, l1, l2, v1x, v1y, v2x, v2y, r1: l1 / tot, r2: l2 / tot };
}

export function mountPca(root) {
  const { canvas } = labShell(root, {
    title: "PCA",
    kicker: "Chapter 1 · Classical ML",
    body: "Principal Component Analysis finds directions of maximum variance. Drag stretch and angle of the cloud — the gold axis is PC1 (most variance), violet is PC2. Dimensionality reduction keeps PC1 and drops the rest.",
    formula: "C = cov(X)\nC v = λ v   (eigenvectors = PCs)",
    guideKey: "pca",
    notesHref: "#/notes?doc=PCA%2Fbeautified_pca_notes.pdf",
    controlsHtml: `
      <label class="ctrl">Cloud stretch <span id="stv" class="stat">2.2</span>
        <input id="stretch" type="range" min="0.6" max="3.2" step="0.05" value="2.2" />
      </label>
      <label class="ctrl">Rotation ° <span id="av" class="stat">35</span>
        <input id="angle" type="range" min="0" max="180" step="1" value="35" />
      </label>
      <label class="ctrl">Points <span id="pv" class="stat">80</span>
        <input id="npts" type="range" min="20" max="160" step="1" value="80" />
      </label>
      <div class="btn-row">
        <button id="resample">Resample cloud</button>
      </div>
      <p class="explain" id="status"></p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let pts = makeCloud(80, 2.2, (35 * Math.PI) / 180);

  function refresh() {
    pts = makeCloud(
      Number(root.querySelector("#npts").value),
      Number(root.querySelector("#stretch").value),
      (Number(root.querySelector("#angle").value) * Math.PI) / 180
    );
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    const C = paintStage(ctx, W, H);
    const P = pca(pts);
    root.querySelector("#status").innerHTML =
      `PC1 explains <span class="stat">${(P.r1 * 100).toFixed(1)}%</span> · PC2 <span class="stat">${(P.r2 * 100).toFixed(1)}%</span>`;

    const toX = (x) => W / 2 + x * (W * 0.18);
    const toY = (y) => H / 2 - y * (H * 0.18);

    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(40, H / 2);
    ctx.lineTo(W - 40, H / 2);
    ctx.moveTo(W / 2, 40);
    ctx.lineTo(W / 2, H - 40);
    ctx.stroke();

    pts.forEach((p) => {
      ctx.fillStyle = "rgba(110,224,196,0.75)";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    const drawAxis = (vx, vy, len, color, label) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toX(P.mx - vx * len), toY(P.my - vy * len));
      ctx.lineTo(toX(P.mx + vx * len), toY(P.my + vy * len));
      ctx.stroke();
      ctx.font = "13px Source Sans 3, sans-serif";
      ctx.fillText(label, toX(P.mx + vx * len) + 6, toY(P.my + vy * len));
    };
    drawAxis(P.v1x, P.v1y, 1.8 + P.r1, C.brass, "PC1");
    drawAxis(P.v2x, P.v2y, 0.9 + P.r2, C.violet, "PC2");
  }

  root.querySelector("#stretch").oninput = (e) => {
    root.querySelector("#stv").textContent = Number(e.target.value).toFixed(2);
    refresh();
  };
  root.querySelector("#angle").oninput = (e) => {
    root.querySelector("#av").textContent = e.target.value;
    refresh();
  };
  root.querySelector("#npts").oninput = (e) => {
    root.querySelector("#pv").textContent = e.target.value;
  };
  root.querySelector("#npts").onchange = refresh;
  root.querySelector("#resample").onclick = refresh;

  let raf;
  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };
  loop();
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

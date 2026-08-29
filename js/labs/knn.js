import { labShell, setupCanvas, setInspect } from "../ui.js";
import { playgroundClassify } from "../data/playground.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function predict(pts, q, k) {
  const ranked = pts
    .map((p, i) => ({ p, i, d: dist(p, q) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  const votes = ranked.reduce((s, r) => s + r.p.label, 0);
  return { label: votes > k / 2 ? 1 : 0, neighbors: ranked };
}

export function mountKnn(root) {
  const { canvas, inspect } = labShell(root, {
    title: "k-Nearest neighbors",
    kicker: "Chapter 1 · Classical ML",
    body: "Same shared playground as logistic regression and the tree — but no weights. A query point borrows the majority label of its k nearest neighbors. Small k = jagged; large k = smoother.",
    formula: "ŷ(x) = majority{ yᵢ : i ∈ kNN(x) }",
    bannerHtml: pathBannerHtml("path-knn"),
    controlsHtml: `
      <label class="ctrl">k <span id="kv" class="stat">3</span>
        <input id="k" type="range" min="1" max="15" step="2" value="3" />
      </label>
      <label class="ctrl">Playground seed <span id="seedv" class="stat">42</span>
        <input id="seed" type="range" min="1" max="99" step="1" value="42" />
      </label>
      <p class="explain">Move the pointer over the plot — that is the query. Neighbors highlight in gold.</p>
      <p class="explain" id="status"></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let pts = playgroundClassify(42);
  let k = 3;
  let query = { x: 0, y: 0 };
  let neigh = [];

  function reload() {
    pts = playgroundClassify(Number(root.querySelector("#seed").value));
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    ctx.clearRect(0, 0, W, H);
    const pad = 40;
    const toX = (x) => pad + ((x + 1.2) / 2.4) * (W - pad * 2);
    const toY = (y) => H - pad - ((y + 1.2) / 2.4) * (H - pad * 2);

    const step = 12;
    for (let yy = pad; yy < H - pad; yy += step) {
      for (let xx = pad; xx < W - pad; xx += step) {
        const x = ((xx - pad) / (W - pad * 2)) * 2.4 - 1.2;
        const y = ((H - pad - yy) / (H - pad * 2)) * 2.4 - 1.2;
        const lab = predict(pts, { x, y }, k).label;
        ctx.fillStyle = lab ? "rgba(110,224,196,0.16)" : "rgba(239,123,108,0.16)";
        ctx.fillRect(xx, yy, step, step);
      }
    }

    const pred = predict(pts, query, k);
    neigh = pred.neighbors;
    neigh.forEach((n) => {
      ctx.strokeStyle = "#d4a574";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(toX(query.x), toY(query.y));
      ctx.lineTo(toX(n.p.x), toY(n.p.y));
      ctx.stroke();
    });

    pts.forEach((p, i) => {
      const hit = neigh.some((n) => n.i === i);
      ctx.fillStyle = p.label ? "#6ee0c4" : "#ef7b6c";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), hit ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (hit) {
        ctx.strokeStyle = "#d4a574";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#f0ece4";
    ctx.beginPath();
    ctx.arc(toX(query.x), toY(query.y), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pred.label ? "#6ee0c4" : "#ef7b6c";
    ctx.lineWidth = 3;
    ctx.stroke();

    root.querySelector("#status").innerHTML =
      `query → class <span class="stat">${pred.label}</span> (k=${k}, shared playground)`;
  }

  canvas.addEventListener("mousemove", (e) => {
    const { w: W, h: H } = cssSize();
    const pad = 40;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    query = {
      x: ((mx - pad) / (W - pad * 2)) * 2.4 - 1.2,
      y: ((H - pad - my) / (H - pad * 2)) * 2.4 - 1.2,
    };
    const pred = predict(pts, query, k);
    setInspect(
      inspect,
      `Neighbors: ${pred.neighbors.map((n) => `#${n.i}(y=${n.p.label}, d=${n.d.toFixed(2)})`).join(", ")}`
    );
  });

  root.querySelector("#k").oninput = (e) => {
    k = Number(e.target.value);
    root.querySelector("#kv").textContent = String(k);
  };
  root.querySelector("#seed").oninput = (e) => {
    root.querySelector("#seedv").textContent = e.target.value;
  };
  root.querySelector("#seed").onchange = reload;

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

import { labShell, setupCanvas, setInspect, paintStage } from "../ui.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

/** Simple 2D loss bowl + saddle for GD intuition. */
export function mountLandscape(root) {
  const { canvas, inspect } = labShell(root, {
    title: "Loss landscape",
    kicker: "Chapter 0 · Optimization",
    body: "Think of training as a ball rolling on a surface. Learning rate is step size: too small crawls; too large overshoots. Try the bowl, then the saddle.",
    formula: "θ ← θ − η ∇L(θ)\nbowl: L = x² + 0.4 y²   ·   saddle: L = x² − y²",
    guideKey: "landscape",
    bannerHtml: pathBannerHtml("path-landscape"),
    controlsHtml: `
      <label class="ctrl">Surface
        <select id="surf">
          <option value="bowl">Bowl (convex)</option>
          <option value="saddle">Saddle</option>
        </select>
      </label>
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.12</span>
        <input id="lr" type="range" min="0.01" max="0.9" step="0.01" value="0.12" />
      </label>
      <div class="btn-row">
        <button id="step">One step</button>
        <button id="run">Run 40 steps</button>
        <button class="ghost" id="auto">Auto</button>
        <button class="ghost" id="reset">Reset ball</button>
      </div>
      <p class="explain" id="status"></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let x = -1.1;
  let y = 0.85;
  let trail = [{ x, y }];
  let auto = false;
  let mode = "bowl";

  function L(xx, yy) {
    return mode === "bowl" ? xx * xx + 0.4 * yy * yy : xx * xx - yy * yy;
  }
  function grad(xx, yy) {
    return mode === "bowl" ? { gx: 2 * xx, gy: 0.8 * yy } : { gx: 2 * xx, gy: -2 * yy };
  }

  function stepOnce() {
    const lr = Number(root.querySelector("#lr").value);
    const g = grad(x, y);
    x -= lr * g.gx;
    y -= lr * g.gy;
    trail.push({ x, y });
    if (trail.length > 80) trail.shift();
  }

  function report() {
    const g = grad(x, y);
    root.querySelector("#status").innerHTML =
      `θ=(${x.toFixed(2)}, ${y.toFixed(2)}) · L=<span class="stat">${L(x, y).toFixed(3)}</span> · ‖∇L‖=${Math.hypot(g.gx, g.gy).toFixed(3)}`;
    setInspect(inspect, `∇L = (${g.gx.toFixed(3)}, ${g.gy.toFixed(3)}) — step subtracts η·∇L`);
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    const C = paintStage(ctx, W, H);
    const pad = 36;
    const toX = (xx) => pad + ((xx + 2) / 4) * (W - pad * 2);
    const toY = (yy) => H - pad - ((yy + 2) / 4) * (H - pad * 2);

    const step = 8;
    let minL = Infinity;
    let maxL = -Infinity;
    const grid = [];
    for (let yy = pad; yy < H - pad; yy += step) {
      for (let xx = pad; xx < W - pad; xx += step) {
        const X = ((xx - pad) / (W - pad * 2)) * 4 - 2;
        const Y = ((H - pad - yy) / (H - pad * 2)) * 4 - 2;
        const v = L(X, Y);
        grid.push({ xx, yy, v });
        minL = Math.min(minL, v);
        maxL = Math.max(maxL, v);
      }
    }
    grid.forEach(({ xx, yy, v }) => {
      const t = (v - minL) / (maxL - minL + 1e-6);
      ctx.fillStyle = C.light
        ? `rgb(${245 - t * 70},${232 - t * 90},${210 - t * 40})`
        : `rgb(${20 + t * 40},${30 + (1 - t) * 140},${50 + t * 80})`;
      ctx.fillRect(xx, yy, step, step);
    });

    ctx.strokeStyle = C.ink;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const X = toX(p.x);
      const Y = toY(p.y);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(toX(x), toY(y), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.brass;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  root.querySelector("#lr").oninput = (e) => {
    root.querySelector("#lrv").textContent = Number(e.target.value).toFixed(2);
  };
  root.querySelector("#surf").onchange = (e) => {
    mode = e.target.value;
    root.querySelector("#reset").click();
  };
  root.querySelector("#step").onclick = () => {
    stepOnce();
    report();
  };
  root.querySelector("#run").onclick = () => {
    for (let i = 0; i < 40; i++) stepOnce();
    report();
  };
  root.querySelector("#auto").onclick = () => {
    auto = !auto;
    root.querySelector("#auto").textContent = auto ? "Pause" : "Auto";
  };
  root.querySelector("#reset").onclick = () => {
    x = -1.1;
    y = 0.85;
    trail = [{ x, y }];
    report();
  };

  report();
  let raf;
  let acc = 0;
  let prev = performance.now();
  const loop = (now) => {
    if (auto) {
      acc += now - prev;
      if (acc > 80) {
        acc = 0;
        stepOnce();
        report();
      }
    }
    prev = now;
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

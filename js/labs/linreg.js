import { labShell, setupCanvas, setInspect, paintStage } from "../ui.js";
import { playgroundRegression } from "../data/playground.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

export function mountLinreg(root) {
  const { canvas, inspect } = labShell(root, {
    title: "Linear regression",
    kicker: "Chapter 1 · Classical ML",
    body: "Fit a line ŷ = wx + b by gradient descent. Step one epoch at a time, or scrub the loss history after training.",
    formula: "L = ½ Σ (ŷᵢ − yᵢ)²\nw ← w − η · ∂L/∂w",
    guideKey: "linreg",
    notesHref: "#/notes?doc=Linear%20Regression%2Flinear_classifier_study_notes.pdf",
    bannerHtml: pathBannerHtml("path-linreg"),
    controlsHtml: `
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.08</span>
        <input id="lr" type="range" min="0.005" max="0.4" step="0.005" value="0.08" />
      </label>
      <label class="ctrl">Epochs per click <span id="epv" class="stat">25</span>
        <input id="epochs" type="range" min="1" max="200" step="1" value="25" />
      </label>
      <label class="ctrl">Noise <span id="nv" class="stat">0.35</span>
        <input id="noise" type="range" min="0" max="1.2" step="0.05" value="0.35" />
      </label>
      <label class="ctrl">Seed <span id="seedv" class="stat">7</span>
        <input id="seed" type="range" min="1" max="99" step="1" value="7" />
      </label>
      <label class="ctrl">Scrub history <span id="scrubv" class="stat">live</span>
        <input id="scrub" type="range" min="0" max="0" step="1" value="0" disabled />
      </label>
      <div class="btn-row">
        <button id="step">One epoch</button>
        <button id="train">Train epochs</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Resample</button>
      </div>
      <p class="explain" id="status"></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let w = 0;
  let b = 0;
  let pts = playgroundRegression(7, 28, 0.35);
  let epoch = 0;
  let auto = false;
  const hist = []; // {w,b,loss,epoch}
  let viewIdx = -1;

  function lossAt(ww, bb) {
    return pts.reduce((s, p) => s + (ww * p.x + bb - p.y) ** 2, 0) / (2 * pts.length);
  }

  function step(lr) {
    let gw = 0;
    let gb = 0;
    pts.forEach((p) => {
      const e = w * p.x + b - p.y;
      gw += e * p.x;
      gb += e;
    });
    gw /= pts.length;
    gb /= pts.length;
    w -= lr * gw;
    b -= lr * gb;
    epoch += 1;
    hist.push({ w, b, loss: lossAt(w, b), epoch, gw, gb });
    if (hist.length > 200) hist.shift();
    syncScrub(true);
  }

  function syncScrub(toEnd) {
    const scrub = root.querySelector("#scrub");
    scrub.disabled = hist.length === 0;
    scrub.max = Math.max(0, hist.length - 1);
    if (toEnd || viewIdx < 0) {
      scrub.value = scrub.max;
      viewIdx = -1;
      root.querySelector("#scrubv").textContent = "live";
    }
  }

  function viewed() {
    if (viewIdx >= 0 && hist[viewIdx]) return hist[viewIdx];
    return { w, b, loss: lossAt(w, b), epoch, gw: 0, gb: 0 };
  }

  function report() {
    const v = viewed();
    root.querySelector("#status").innerHTML =
      `epoch <span class="stat">${v.epoch}</span> · w=${v.w.toFixed(3)} · b=${v.b.toFixed(3)} · loss=<span class="stat">${v.loss.toFixed(4)}</span>`;
    setInspect(inspect, `∂L/∂w≈${(v.gw || 0).toFixed(3)}, ∂L/∂b≈${(v.gb || 0).toFixed(3)} (last step grads when live)`);
  }

  function draw() {
    const v = viewed();
    const { w: W, h: H } = cssSize();
    const C = paintStage(ctx, W, H);
    const ox = 50;
    const oy = H - 50;
    const sx = (W - 100) / 2;
    const sy = (H - 100) / 2;
    const toX = (x) => ox + (x + 1) * sx;
    const toY = (y) => oy - (y + 1) * sy;

    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(W - 40, oy);
    ctx.moveTo(ox, 40);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    pts.forEach((p) => {
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = C.brass;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(-1), toY(v.w * -1 + v.b));
    ctx.lineTo(toX(1), toY(v.w * 1 + v.b));
    ctx.stroke();

    ctx.strokeStyle = C.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hist.forEach((h, i) => {
      const x = W - 150 + (i / Math.max(1, hist.length - 1)) * 120;
      const y = 30 + 70 - Math.min(1, h.loss) * 70;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (viewIdx >= 0 && hist[viewIdx]) {
      const x = W - 150 + (viewIdx / Math.max(1, hist.length - 1)) * 120;
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(x, 30 + 70 - Math.min(1, hist[viewIdx].loss) * 70, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = C.muted;
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.fillText("loss", W - 150, 24);
  }

  const bind = (id, label, fmt) => {
    root.querySelector(`#${id}`).oninput = (e) => {
      root.querySelector(`#${label}`).textContent = fmt(Number(e.target.value));
    };
  };
  bind("lr", "lrv", (v) => v.toFixed(3));
  bind("epochs", "epv", String);
  bind("noise", "nv", (v) => v.toFixed(2));
  bind("seed", "seedv", String);

  root.querySelector("#scrub").oninput = (e) => {
    viewIdx = Number(e.target.value);
    root.querySelector("#scrubv").textContent = `t=${viewIdx}`;
    report();
  };
  root.querySelector("#step").onclick = () => {
    viewIdx = -1;
    step(Number(root.querySelector("#lr").value));
    report();
  };
  root.querySelector("#train").onclick = () => {
    viewIdx = -1;
    const lr = Number(root.querySelector("#lr").value);
    const n = Number(root.querySelector("#epochs").value);
    for (let i = 0; i < n; i++) step(lr);
    report();
  };
  root.querySelector("#auto").onclick = () => {
    auto = !auto;
    root.querySelector("#auto").textContent = auto ? "Pause" : "Auto-train";
  };
  root.querySelector("#reset").onclick = () => {
    pts = playgroundRegression(
      Number(root.querySelector("#seed").value),
      28,
      Number(root.querySelector("#noise").value)
    );
    w = 0;
    b = 0;
    epoch = 0;
    hist.length = 0;
    viewIdx = -1;
    syncScrub(true);
    report();
  };
  root.querySelector("#noise").onchange = () => root.querySelector("#reset").click();
  root.querySelector("#seed").onchange = () => root.querySelector("#reset").click();

  report();
  let raf;
  let acc = 0;
  let prev = performance.now();
  const loop = (now) => {
    if (auto) {
      acc += now - prev;
      if (acc > 40) {
        acc = 0;
        viewIdx = -1;
        step(Number(root.querySelector("#lr").value));
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

import { labShell, setupCanvas } from "../ui.js";

function makeData(n, noise) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = -1 + (2 * i) / (n - 1);
    const y = 0.55 * x + 0.1 + (Math.random() - 0.5) * noise;
    pts.push({ x, y });
  }
  return pts;
}

export function mountLinreg(root) {
  const { canvas } = labShell(root, {
    title: "Linear regression",
    kicker: "Chapter 1 · Classical ML",
    body: "Fit a line ŷ = wx + b by gradient descent. Each epoch nudges slope and intercept to shrink squared error. Turn up noise or epochs and watch the fit settle — the same idea later powers neural nets.",
    formula: "L = ½ Σ (ŷᵢ − yᵢ)²\nw ← w − η · ∂L/∂w",
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
      <label class="ctrl">Points <span id="pv" class="stat">24</span>
        <input id="npts" type="range" min="8" max="60" step="1" value="24" />
      </label>
      <div class="btn-row">
        <button id="train">Train epochs</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Resample</button>
      </div>
      <p class="explain" id="status"></p>
      <p class="explain"><a class="ext" href="https://github.com/Akshay-Anand010/AIML-IIITH-2026/blob/main/Linear%20Regression/linear_classifier_study_notes.pdf" target="_blank" rel="noreferrer">Related notes →</a></p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let w = 0;
  let b = 0;
  let pts = makeData(24, 0.35);
  let epoch = 0;
  let auto = false;
  const hist = [];

  function loss() {
    return pts.reduce((s, p) => s + (w * p.x + b - p.y) ** 2, 0) / (2 * pts.length);
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
    hist.push(loss());
    if (hist.length > 100) hist.shift();
  }

  function trainN() {
    const lr = Number(root.querySelector("#lr").value);
    const n = Number(root.querySelector("#epochs").value);
    for (let i = 0; i < n; i++) step(lr);
    report();
  }

  function report() {
    root.querySelector("#status").innerHTML =
      `epoch <span class="stat">${epoch}</span> · w=${w.toFixed(3)} · b=${b.toFixed(3)} · loss=<span class="stat">${loss().toFixed(4)}</span>`;
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    ctx.clearRect(0, 0, W, H);
    const ox = 50;
    const oy = H - 50;
    const sx = (W - 100) / 2;
    const sy = (H - 100) / 2;
    const toX = (x) => ox + (x + 1) * sx;
    const toY = (y) => oy - (y + 1) * sy;

    ctx.strokeStyle = "rgba(240,236,228,0.12)";
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(W - 40, oy);
    ctx.moveTo(ox, 40);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    pts.forEach((p) => {
      ctx.fillStyle = "#6ee0c4";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(-1), toY(w * -1 + b));
    ctx.lineTo(toX(1), toY(w * 1 + b));
    ctx.stroke();

    // loss spark
    ctx.strokeStyle = "#b9a6ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = W - 150 + (i / 100) * 120;
      const y = 30 + 70 - Math.min(1, v) * 70;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#9a948a";
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.fillText("loss", W - 150, 24);
  }

  const bind = (id, label, fmt) => {
    const el = root.querySelector(`#${id}`);
    el.oninput = () => {
      root.querySelector(`#${label}`).textContent = fmt(Number(el.value));
    };
  };
  bind("lr", "lrv", (v) => v.toFixed(3));
  bind("epochs", "epv", (v) => String(v));
  bind("noise", "nv", (v) => v.toFixed(2));
  bind("npts", "pv", (v) => String(v));

  root.querySelector("#train").onclick = trainN;
  root.querySelector("#auto").onclick = () => {
    auto = !auto;
    root.querySelector("#auto").textContent = auto ? "Pause" : "Auto-train";
  };
  root.querySelector("#reset").onclick = () => {
    pts = makeData(Number(root.querySelector("#npts").value), Number(root.querySelector("#noise").value));
    w = 0;
    b = 0;
    epoch = 0;
    hist.length = 0;
    report();
  };
  root.querySelector("#noise").onchange = () => root.querySelector("#reset").click();
  root.querySelector("#npts").onchange = () => root.querySelector("#reset").click();

  report();
  let raf;
  let acc = 0;
  let prev = performance.now();
  const loop = (now) => {
    if (auto) {
      acc += now - prev;
      if (acc > 40) {
        acc = 0;
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

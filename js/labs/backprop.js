import { labShell, setupCanvas, lerp, setInspect } from "../ui.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

/** Tiny MLP trained on XOR with visible forward + backward passes. */
export function mountBackprop(root) {
  const { canvas, inspect } = labShell(root, {
    title: "Backpropagation",
    kicker: "Chapter 2 · Deep learning",
    body: "The network guesses XOR. Step one example, scrub the loss curve, hover an edge to inspect its weight. Coral pulses are error walking backward.",
    formula: "L = (ŷ − y)²\nW ← W − η · ∂L/∂W",
    guideKey: "backprop",
    notesHref: "#/notes?doc=reading-materials%2FU3%2F2026-07-25_CNN-Back-Propagation%2Flecture-notes%2FBack-Propagation__Back-Propagation.pdf",
    bannerHtml: pathBannerHtml("path-backprop"),
    controlsHtml: `
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.25</span>
        <input id="lr" type="range" min="0.02" max="0.8" step="0.01" value="0.25" />
      </label>
      <label class="ctrl">Epochs to run <span id="epv" class="stat">20</span>
        <input id="epochs" type="range" min="1" max="200" step="1" value="20" />
      </label>
      <label class="ctrl">Hidden units <span id="hv" class="stat">4</span>
        <input id="hidden" type="range" min="2" max="8" step="1" value="4" />
      </label>
      <label class="ctrl">Anim. speed <span id="spv" class="stat">1.0×</span>
        <input id="speed" type="range" min="0.4" max="2.5" step="0.1" value="1" />
      </label>
      <label class="ctrl">Scrub loss history <span id="scrubv" class="stat">live</span>
        <input id="scrub" type="range" min="0" max="0" step="1" value="0" disabled />
      </label>
      <div class="btn-row">
        <button id="step">One example</button>
        <button id="runEpochs">Train epochs</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Reset</button>
      </div>
      <p class="explain" id="status"></p>
    `,
    legend: `<span><i class="swatch" style="background:#6ee0c4"></i>forward</span>
             <span><i class="swatch" style="background:#ef7b6c"></i>backward error</span>`,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const data = [
    { x: [0, 0], y: 0 },
    { x: [0, 1], y: 1 },
    { x: [1, 0], y: 1 },
    { x: [1, 1], y: 0 },
  ];

  let hiddenN = 4;
  let net = initNet(hiddenN);
  let example = 0;
  let epochCount = 0;
  let auto = false;
  let phase = "idle";
  let t = 0;
  let last = { x: [0, 0], y: 0, yhat: 0, loss: 0 };
  const lossHist = [];
  let scrubIdx = -1;
  let edgeMeta = [];

  function initNet(h) {
    const rand = () => (Math.random() * 2 - 1) * 0.8;
    return {
      W1: Array.from({ length: h }, () => [rand(), rand()]),
      b1: Array(h).fill(0),
      W2: [Array.from({ length: h }, rand)],
      b2: [0],
    };
  }

  function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }
  function dsig(a) {
    return a * (1 - a);
  }

  function forward(x, n = net) {
    const z1 = n.W1.map((row, j) => row[0] * x[0] + row[1] * x[1] + n.b1[j]);
    const a1 = z1.map(sigmoid);
    const z2 = n.W2[0].reduce((s, w, i) => s + w * a1[i], 0) + n.b2[0];
    const a2 = sigmoid(z2);
    return { x, z1, a1, z2, a2 };
  }

  function backward(cache, y, lr) {
    const { x, a1, a2 } = cache;
    const dLda2 = 2 * (a2 - y);
    const dz2 = dLda2 * dsig(a2);
    const dW2 = a1.map((a) => dz2 * a);
    const db2 = dz2;
    const da1 = net.W2[0].map((w) => w * dz2);
    const dz1 = da1.map((d, i) => d * dsig(a1[i]));
    const dW1 = dz1.map((d) => [d * x[0], d * x[1]]);
    const db1 = dz1;
    net.W2[0] = net.W2[0].map((w, i) => w - lr * dW2[i]);
    net.b2[0] -= lr * db2;
    net.W1 = net.W1.map((row, j) => [row[0] - lr * dW1[j][0], row[1] - lr * dW1[j][1]]);
    net.b1 = net.b1.map((b, j) => b - lr * db1[j]);
  }

  function runExample(animate = true) {
    const lr = Number(root.querySelector("#lr").value);
    const sample = data[example % 4];
    example += 1;
    if (example % 4 === 0) epochCount += 1;
    const cache = forward(sample.x);
    const loss = (cache.a2 - sample.y) ** 2;
    last = { ...sample, yhat: cache.a2, loss, cache };
    lossHist.push(loss);
    if (lossHist.length > 120) lossHist.shift();
    const scrub = root.querySelector("#scrub");
    scrub.disabled = false;
    scrub.max = String(lossHist.length - 1);
    scrub.value = String(lossHist.length - 1);
    scrubIdx = -1;
    root.querySelector("#scrubv").textContent = "live";
    backward(cache, sample.y, lr);
    if (animate) {
      phase = "fwd";
      t = 0;
    }
    return last;
  }

  function layout() {
    const { w, h } = cssSize();
    const left = 50;
    const right = w - 160;
    const ins = [
      { x: left, y: h * 0.32 },
      { x: left, y: h * 0.62 },
    ];
    const hid = Array.from({ length: net.W1.length }, (_, i) => ({
      x: (left + right) / 2,
      y: 60 + ((i + 0.5) / net.W1.length) * (h - 100),
    }));
    const out = [{ x: right - 20, y: h * 0.47 }];
    return { ins, hid, out, w, h };
  }

  function draw() {
    const L = layout();
    ctx.clearRect(0, 0, L.w, L.h);
    const cache = last.cache || forward([0, 0]);

    const edges = [];
    L.ins.forEach((a, i) =>
      L.hid.forEach((b, j) => edges.push({ a, b, w: net.W1[j][i], name: `W1[${j},${i}]` }))
    );
    L.hid.forEach((a, i) => edges.push({ a, b: L.out[0], w: net.W2[0][i], name: `W2[0,${i}]` }));
    edgeMeta = edges;

    edges.forEach((e) => {
      ctx.strokeStyle = e.w >= 0 ? "rgba(212,165,116,0.45)" : "rgba(239,123,108,0.45)";
      ctx.lineWidth = 0.7 + Math.min(3.5, Math.abs(e.w));
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    });

    const p = phase === "idle" ? 1 : t;
    if (phase === "fwd" || phase === "bwd") {
      edges.forEach((e, i) => {
        const local = p * 1.2 - i * 0.01;
        const u = Math.max(0, Math.min(1, local));
        const x = lerp(e.a.x, e.b.x, phase === "bwd" ? 1 - u : u);
        const y = lerp(e.a.y, e.b.y, phase === "bwd" ? 1 - u : u);
        ctx.fillStyle = phase === "fwd" ? "#6ee0c4" : "#ef7b6c";
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const nodes = [
      ...L.ins.map((p, i) => ({ ...p, v: cache.x[i], lab: `x${i + 1}` })),
      ...L.hid.map((p, i) => ({ ...p, v: cache.a1[i], lab: `h${i + 1}` })),
      { ...L.out[0], v: cache.a2, lab: "ŷ" },
    ];
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(110,224,196,${0.12 + 0.75 * n.v})`;
      ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0ece4";
      ctx.stroke();
      ctx.fillStyle = "#f0ece4";
      ctx.font = "11px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(n.lab, n.x, n.y - 18);
      ctx.fillText(n.v.toFixed(2), n.x, n.y + 26);
    });

    const bx = L.w - 140;
    const by = 24;
    ctx.fillStyle = "#9a948a";
    ctx.textAlign = "left";
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.fillText("loss", bx, by);
    ctx.strokeStyle = "#d4a574";
    ctx.beginPath();
    lossHist.forEach((v, i) => {
      const x = bx + (i / Math.max(1, lossHist.length - 1)) * 120;
      const y = by + 70 - Math.min(1, v) * 60;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (scrubIdx >= 0 && lossHist[scrubIdx] != null) {
      const x = bx + (scrubIdx / Math.max(1, lossHist.length - 1)) * 120;
      const y = by + 70 - Math.min(1, lossHist[scrubIdx]) * 60;
      ctx.fillStyle = "#f0ece4";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let best = null;
    let bestD = 10;
    edgeMeta.forEach((ed) => {
      const dx = ed.b.x - ed.a.x;
      const dy = ed.b.y - ed.a.y;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((mx - ed.a.x) * dx + (my - ed.a.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = ed.a.x + t * dx;
      const py = ed.a.y + t * dy;
      const d = Math.hypot(mx - px, my - py);
      if (d < bestD) {
        bestD = d;
        best = ed;
      }
    });
    if (best) setInspect(inspect, `${best.name} = <span class="stat">${best.w.toFixed(3)}</span>`);
    else if (scrubIdx >= 0) setInspect(inspect, `History loss[${scrubIdx}] = ${lossHist[scrubIdx]?.toFixed(4)}`);
    else setInspect(inspect, "");
  });

  function tickPhase() {
    const spd = Number(root.querySelector("#speed").value);
    if (phase === "fwd") {
      t += 0.025 * spd;
      if (t >= 1) {
        phase = "bwd";
        t = 0;
      }
    } else if (phase === "bwd") {
      t += 0.025 * spd;
      if (t >= 1) phase = "idle";
    }
  }

  const status = root.querySelector("#status");
  root.querySelector("#lr").oninput = (e) => {
    root.querySelector("#lrv").textContent = Number(e.target.value).toFixed(2);
  };
  root.querySelector("#epochs").oninput = (e) => {
    root.querySelector("#epv").textContent = e.target.value;
  };
  root.querySelector("#speed").oninput = (e) => {
    root.querySelector("#spv").textContent = `${Number(e.target.value).toFixed(1)}×`;
  };
  root.querySelector("#scrub").oninput = (e) => {
    scrubIdx = Number(e.target.value);
    root.querySelector("#scrubv").textContent = `t=${scrubIdx}`;
    setInspect(inspect, `History loss[${scrubIdx}] = ${lossHist[scrubIdx]?.toFixed(4)}`);
  };
  root.querySelector("#hidden").oninput = (e) => {
    root.querySelector("#hv").textContent = e.target.value;
  };
  root.querySelector("#hidden").onchange = () => {
    hiddenN = Number(root.querySelector("#hidden").value);
    net = initNet(hiddenN);
    epochCount = 0;
    example = 0;
    lossHist.length = 0;
    last = { x: [0, 0], y: 0, yhat: 0, loss: 0, cache: forward([0, 0]) };
    report();
  };

  function report() {
    const acc = data.filter((d) => (forward(d.x).a2 > 0.5 ? 1 : 0) === d.y).length / 4;
    status.innerHTML = `epochs≈<span class="stat">${epochCount}</span> · last [${last.x.join(", ")}] → y=${last.y}, ŷ=${last.yhat.toFixed(3)}, loss=${last.loss.toFixed(3)} · XOR acc <span class="stat">${(acc * 100).toFixed(0)}%</span>`;
  }

  root.querySelector("#step").onclick = () => {
    runExample(true);
    report();
  };
  root.querySelector("#runEpochs").onclick = () => {
    const n = Number(root.querySelector("#epochs").value);
    for (let i = 0; i < n * 4; i++) runExample(false);
    phase = "fwd";
    t = 0;
    report();
  };
  root.querySelector("#auto").onclick = () => {
    auto = !auto;
    root.querySelector("#auto").textContent = auto ? "Pause" : "Auto-train";
  };
  root.querySelector("#reset").onclick = () => {
    hiddenN = Number(root.querySelector("#hidden").value);
    net = initNet(hiddenN);
    lossHist.length = 0;
    example = 0;
    epochCount = 0;
    last = { x: [0, 0], y: 0, yhat: 0, loss: 0, cache: forward([0, 0]) };
    report();
  };

  last.cache = forward([0, 0]);
  report();

  let raf;
  let accTime = 0;
  let prev = performance.now();
  const loop = (now) => {
    const dt = now - prev;
    prev = now;
    tickPhase();
    if (auto) {
      accTime += dt;
      const gap = 280 / Number(root.querySelector("#speed").value);
      if (accTime > gap && phase === "idle") {
        accTime = 0;
        runExample(true);
        report();
      }
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

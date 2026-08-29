import { labShell, setupCanvas, lerp } from "../ui.js";

/** Tiny MLP trained on XOR with visible forward + backward passes. */
export function mountBackprop(root) {
  const { canvas } = labShell(root, {
    title: "Backpropagation",
    kicker: "Learning step",
    body: "The network guesses XOR: 1 if the two bits differ. After the forward pass, the error (coral) walks backward. Each weight is nudged in the direction that would have made the guess better. Watch the loss fall as you train.",
    formula: "L = (ŷ − y)²\nW ← W − η · ∂L/∂W",
    controlsHtml: `
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.25</span>
        <input id="lr" type="range" min="0.02" max="0.8" step="0.01" value="0.25" />
      </label>
      <div class="btn-row">
        <button id="step">One example</button>
        <button id="epoch">One epoch (4)</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Reset</button>
      </div>
      <p class="explain" id="status"></p>
    `,
    legend: `<span><i class="swatch" style="background:#6ee0c4"></i>forward</span>
             <span><i class="swatch" style="background:#ef7b6c"></i>backward error</span>`,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const data = [
    { x: [0, 0], y: 0 },
    { x: [0, 1], y: 1 },
    { x: [1, 0], y: 1 },
    { x: [1, 1], y: 0 },
  ];

  let net = initNet();
  let example = 0;
  let auto = false;
  let phase = "idle";
  let t = 0;
  let last = { x: [0, 0], y: 0, yhat: 0, loss: 0 };
  const lossHist = [];

  function initNet() {
    const rand = () => (Math.random() * 2 - 1) * 0.8;
    return {
      W1: [
        [rand(), rand()],
        [rand(), rand()],
        [rand(), rand()],
        [rand(), rand()],
      ],
      b1: [0, 0, 0, 0],
      W2: [[rand(), rand(), rand(), rand()]],
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
    return { dz2, dz1 };
  }

  function runExample() {
    const lr = Number(root.querySelector("#lr").value);
    const sample = data[example % 4];
    example += 1;
    const cache = forward(sample.x);
    const loss = (cache.a2 - sample.y) ** 2;
    last = { ...sample, yhat: cache.a2, loss, cache };
    lossHist.push(loss);
    if (lossHist.length > 80) lossHist.shift();
    phase = "fwd";
    t = 0;
    last.grads = backward(cache, sample.y, lr);
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
    const hid = [0, 1, 2, 3].map((i) => ({
      x: (left + right) / 2,
      y: 70 + i * ((h - 120) / 3),
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
      L.hid.forEach((b, j) => edges.push({ a, b, w: net.W1[j][i] }))
    );
    L.hid.forEach((a, i) => edges.push({ a, b: L.out[0], w: net.W2[0][i] }));

    edges.forEach((e) => {
      ctx.strokeStyle = e.w >= 0 ? "rgba(212,165,116,0.45)" : "rgba(239,123,108,0.45)";
      ctx.lineWidth = 0.7 + Math.min(3.5, Math.abs(e.w));
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    });

    const p = phase === "fwd" ? t : phase === "bwd" ? t : 1;
    if (phase === "fwd" || phase === "bwd") {
      edges.forEach((e, i) => {
        const local = (p * 1.2 - i * 0.01);
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
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0ece4";
      ctx.stroke();
      ctx.fillStyle = "#f0ece4";
      ctx.font = "11px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(n.lab, n.x, n.y - 20);
      ctx.fillText(n.v.toFixed(2), n.x, n.y + 28);
    });

    // loss sparkline
    const bx = L.w - 140;
    const by = 24;
    ctx.fillStyle = "#9a948a";
    ctx.textAlign = "left";
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.fillText("loss", bx, by);
    ctx.strokeStyle = "#d4a574";
    ctx.beginPath();
    lossHist.forEach((v, i) => {
      const x = bx + (i / 80) * 120;
      const y = by + 70 - Math.min(1, v) * 60;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function tickPhase() {
    if (phase === "fwd") {
      t += 0.025;
      if (t >= 1) {
        phase = "bwd";
        t = 0;
      }
    } else if (phase === "bwd") {
      t += 0.025;
      if (t >= 1) phase = "idle";
    }
  }

  const status = root.querySelector("#status");
  const lr = root.querySelector("#lr");
  lr.oninput = () => {
    root.querySelector("#lrv").textContent = Number(lr.value).toFixed(2);
  };

  function report() {
    const acc =
      data.filter((d) => (forward(d.x).a2 > 0.5 ? 1 : 0) === d.y).length / 4;
    status.innerHTML = `Last: [${last.x.join(", ")}] → target ${last.y}, ŷ=${last.yhat.toFixed(3)}, loss=${last.loss.toFixed(3)}. XOR accuracy: <span class="stat">${(acc * 100).toFixed(0)}%</span>`;
  }

  root.querySelector("#step").onclick = () => {
    runExample();
    report();
  };
  root.querySelector("#epoch").onclick = () => {
    for (let i = 0; i < 4; i++) runExample();
    report();
  };
  root.querySelector("#auto").onclick = () => {
    auto = !auto;
    root.querySelector("#auto").textContent = auto ? "Pause" : "Auto-train";
  };
  root.querySelector("#reset").onclick = () => {
    net = initNet();
    lossHist.length = 0;
    example = 0;
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
      if (accTime > 280 && phase === "idle") {
        accTime = 0;
        runExample();
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

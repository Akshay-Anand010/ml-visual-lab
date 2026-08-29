import { labShell, setupCanvas } from "../ui.js";

function makeData(sep, noise) {
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const cls = i < 20 ? 0 : 1;
    const x = (cls ? 0.35 : -0.35) + (Math.random() - 0.5) * noise + (cls ? sep : -sep) * 0.2;
    const y = (Math.random() - 0.5) * 1.6 + (cls ? 0.15 : -0.15);
    pts.push({ x, y, label: cls });
  }
  return pts;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

export function mountLogreg(root) {
  const { canvas } = labShell(root, {
    title: "Logistic regression",
    kicker: "Chapter 1 · Classical ML",
    body: "Predict a class probability with σ(w·x + b). Gradient descent rotates the decision boundary. This is a linear classifier with a soft “S” — neural nets stack many of these ideas with non-linear layers.",
    formula: "p = σ(w₁x + w₂y + b)\nL = −Σ [y log p + (1−y) log(1−p)]",
    controlsHtml: `
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.35</span>
        <input id="lr" type="range" min="0.02" max="1.2" step="0.02" value="0.35" />
      </label>
      <label class="ctrl">Epochs per click <span id="epv" class="stat">40</span>
        <input id="epochs" type="range" min="1" max="300" step="1" value="40" />
      </label>
      <label class="ctrl">Class separation <span id="sv" class="stat">0.8</span>
        <input id="sep" type="range" min="0" max="1.4" step="0.05" value="0.8" />
      </label>
      <label class="ctrl">Noise <span id="nv" class="stat">0.55</span>
        <input id="noise" type="range" min="0.2" max="1.4" step="0.05" value="0.55" />
      </label>
      <div class="btn-row">
        <button id="train">Train epochs</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Resample</button>
      </div>
      <p class="explain" id="status"></p>
      <p class="explain"><a class="ext" href="https://github.com/Akshay-Anand010/AIML-IIITH-2026/blob/main/Logistic%20Regression/logistic_regression_study_notes.pdf" target="_blank" rel="noreferrer">Related notes →</a></p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let w1 = 0.2;
  let w2 = 0.1;
  let b = 0;
  let pts = makeData(0.8, 0.55);
  let epoch = 0;
  let auto = false;

  function predict(p) {
    return sigmoid(w1 * p.x + w2 * p.y + b);
  }

  function step(lr) {
    let g1 = 0;
    let g2 = 0;
    let gb = 0;
    pts.forEach((p) => {
      const pr = predict(p);
      const e = pr - p.label;
      g1 += e * p.x;
      g2 += e * p.y;
      gb += e;
    });
    const n = pts.length;
    w1 -= (lr * g1) / n;
    w2 -= (lr * g2) / n;
    b -= (lr * gb) / n;
    epoch += 1;
  }

  function accuracy() {
    return pts.filter((p) => (predict(p) > 0.5 ? 1 : 0) === p.label).length / pts.length;
  }

  function report() {
    root.querySelector("#status").innerHTML =
      `epoch <span class="stat">${epoch}</span> · acc <span class="stat">${(accuracy() * 100).toFixed(0)}%</span> · w=[${w1.toFixed(2)}, ${w2.toFixed(2)}] b=${b.toFixed(2)}`;
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    ctx.clearRect(0, 0, W, H);
    const pad = 40;
    const toX = (x) => pad + ((x + 1.2) / 2.4) * (W - pad * 2);
    const toY = (y) => H - pad - ((y + 1.2) / 2.4) * (H - pad * 2);

    // decision field
    const stepG = 14;
    for (let yy = pad; yy < H - pad; yy += stepG) {
      for (let xx = pad; xx < W - pad; xx += stepG) {
        const x = ((xx - pad) / (W - pad * 2)) * 2.4 - 1.2;
        const y = ((H - pad - yy) / (H - pad * 2)) * 2.4 - 1.2;
        const p = sigmoid(w1 * x + w2 * y + b);
        ctx.fillStyle = `rgba(110,224,196,${p * 0.22})`;
        ctx.fillRect(xx, yy, stepG, stepG);
        ctx.fillStyle = `rgba(239,123,108,${(1 - p) * 0.18})`;
        ctx.fillRect(xx, yy, stepG, stepG);
      }
    }

    // boundary w1 x + w2 y + b = 0
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (Math.abs(w2) > 1e-4) {
      const yL = -(w1 * -1.2 + b) / w2;
      const yR = -(w1 * 1.2 + b) / w2;
      ctx.moveTo(toX(-1.2), toY(yL));
      ctx.lineTo(toX(1.2), toY(yR));
    }
    ctx.stroke();

    pts.forEach((p) => {
      ctx.fillStyle = p.label ? "#6ee0c4" : "#ef7b6c";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ["lr", "epochs", "sep", "noise"].forEach((id) => {
    const map = { lr: ["lrv", (v) => v.toFixed(2)], epochs: ["epv", String], sep: ["sv", (v) => v.toFixed(2)], noise: ["nv", (v) => v.toFixed(2)] };
    root.querySelector(`#${id}`).oninput = (e) => {
      root.querySelector(`#${map[id][0]}`).textContent = map[id][1](Number(e.target.value));
    };
  });

  root.querySelector("#train").onclick = () => {
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
    pts = makeData(Number(root.querySelector("#sep").value), Number(root.querySelector("#noise").value));
    w1 = 0.2;
    w2 = 0.1;
    b = 0;
    epoch = 0;
    report();
  };

  report();
  let raf;
  let accT = 0;
  let prev = performance.now();
  const loop = (now) => {
    if (auto) {
      accT += now - prev;
      if (accT > 35) {
        accT = 0;
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

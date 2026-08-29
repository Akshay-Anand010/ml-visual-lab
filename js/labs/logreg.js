import { labShell, setupCanvas, setInspect } from "../ui.js";
import { playgroundClassify } from "../data/playground.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

export function mountLogreg(root) {
  const { canvas, inspect } = labShell(root, {
    title: "Logistic regression",
    kicker: "Chapter 1 · Classical ML",
    body: "Same shared playground points as k-NN and the decision tree. A linear boundary is honest but limited — some points will stay misclassified.",
    formula: "p = σ(w₁x + w₂y + b)\nL = −Σ [y log p + (1−y) log(1−p)]",
    bannerHtml: pathBannerHtml("path-logreg"),
    controlsHtml: `
      <label class="ctrl">Learning rate η <span id="lrv" class="stat">0.35</span>
        <input id="lr" type="range" min="0.02" max="1.2" step="0.02" value="0.35" />
      </label>
      <label class="ctrl">Epochs per click <span id="epv" class="stat">40</span>
        <input id="epochs" type="range" min="1" max="300" step="1" value="40" />
      </label>
      <label class="ctrl">Playground seed <span id="seedv" class="stat">42</span>
        <input id="seed" type="range" min="1" max="99" step="1" value="42" />
      </label>
      <div class="btn-row">
        <button id="step">One epoch</button>
        <button id="train">Train epochs</button>
        <button class="ghost" id="auto">Auto-train</button>
        <button class="ghost" id="reset">Reset weights</button>
      </div>
      <p class="explain" id="status"></p>
      <p class="explain"><a class="ext" href="https://github.com/Akshay-Anand010/AIML-IIITH-2026/blob/main/Logistic%20Regression/logistic_regression_study_notes.pdf" target="_blank" rel="noreferrer">Related notes →</a></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let w1 = 0.2;
  let w2 = 0.1;
  let b = 0;
  let pts = playgroundClassify(42);
  let epoch = 0;
  let auto = false;
  let hover = null;

  function reload() {
    pts = playgroundClassify(Number(root.querySelector("#seed").value));
    w1 = 0.2;
    w2 = 0.1;
    b = 0;
    epoch = 0;
  }

  function predict(p) {
    return sigmoid(w1 * p.x + w2 * p.y + b);
  }

  function step(lr) {
    let g1 = 0;
    let g2 = 0;
    let gb = 0;
    pts.forEach((p) => {
      const e = predict(p) - p.label;
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
      `epoch <span class="stat">${epoch}</span> · acc <span class="stat">${(accuracy() * 100).toFixed(0)}%</span> · shared playground (${pts.length} pts)`;
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    ctx.clearRect(0, 0, W, H);
    const pad = 40;
    const toX = (x) => pad + ((x + 1.2) / 2.4) * (W - pad * 2);
    const toY = (y) => H - pad - ((y + 1.2) / 2.4) * (H - pad * 2);

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

    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (Math.abs(w2) > 1e-4) {
      ctx.moveTo(toX(-1.2), toY(-(w1 * -1.2 + b) / w2));
      ctx.lineTo(toX(1.2), toY(-(w1 * 1.2 + b) / w2));
    }
    ctx.stroke();

    pts.forEach((p, idx) => {
      const wrong = (predict(p) > 0.5 ? 1 : 0) !== p.label;
      ctx.fillStyle = p.label ? "#6ee0c4" : "#ef7b6c";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), hover === idx ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (wrong) {
        ctx.strokeStyle = "#f0ece4";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  canvas.addEventListener("mousemove", (e) => {
    const { w: W, h: H } = cssSize();
    const pad = 40;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hover = null;
    pts.forEach((p, idx) => {
      const px = pad + ((p.x + 1.2) / 2.4) * (W - pad * 2);
      const py = H - pad - ((p.y + 1.2) / 2.4) * (H - pad * 2);
      if (Math.hypot(px - mx, py - my) < 10) hover = idx;
    });
    if (hover != null) {
      const p = pts[hover];
      const pr = predict(p);
      setInspect(
        inspect,
        `Point #${hover}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) · label=${p.label} · p̂=${pr.toFixed(3)} · ${pr > 0.5 === !!p.label ? "correct" : "wrong"}`
      );
    } else setInspect(inspect, "");
  });

  ["lr", "epochs", "seed"].forEach((id) => {
    const fmt = { lr: (v) => v.toFixed(2), epochs: String, seed: String };
    const lab = { lr: "lrv", epochs: "epv", seed: "seedv" };
    root.querySelector(`#${id}`).oninput = (e) => {
      root.querySelector(`#${lab[id]}`).textContent = fmt[id](Number(e.target.value));
    };
  });
  root.querySelector("#seed").onchange = () => {
    reload();
    report();
  };
  root.querySelector("#step").onclick = () => {
    step(Number(root.querySelector("#lr").value));
    report();
  };
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

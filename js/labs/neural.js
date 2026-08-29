import { labShell, setupCanvas, lerp } from "../ui.js";

export function mountNeural(root) {
  const { canvas } = labShell(root, {
    title: "Neural network",
    kicker: "Chapter 2 · Deep learning",
    body: "Each neuron takes a weighted sum of the previous layer, then a non-linearity. Change hidden widths and activation — brighter neurons are more active.",
    formula: "a = f(Wx + b)\nf ∈ {ReLU, sigmoid, tanh}",
    controlsHtml: `
      <label class="ctrl">Input x₁ <span id="x1v" class="stat">0.80</span>
        <input id="x1" type="range" min="0" max="1" step="0.01" value="0.8" />
      </label>
      <label class="ctrl">Input x₂ <span id="x2v" class="stat">0.20</span>
        <input id="x2" type="range" min="0" max="1" step="0.01" value="0.2" />
      </label>
      <label class="ctrl">Hidden layer 1 <span id="h1v" class="stat">5</span>
        <input id="h1" type="range" min="2" max="8" step="1" value="5" />
      </label>
      <label class="ctrl">Hidden layer 2 <span id="h2v" class="stat">4</span>
        <input id="h2" type="range" min="2" max="8" step="1" value="4" />
      </label>
      <label class="ctrl">Activation
        <select id="act">
          <option value="relu">ReLU</option>
          <option value="sigmoid">Sigmoid</option>
          <option value="tanh">Tanh</option>
        </select>
      </label>
      <div class="btn-row">
        <button id="pulse">Send pulse</button>
        <button class="ghost" id="shuffle">Shuffle weights</button>
      </div>
      <p class="explain" id="outline"></p>
    `,
    legend: `<span><i class="swatch" style="background:#6ee0c4"></i>activation</span>
             <span><i class="swatch" style="background:#d4a574"></i>positive weight</span>
             <span><i class="swatch" style="background:#ef7b6c"></i>negative weight</span>`,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let layers = [2, 5, 4, 1];
  let W = initWeights(layers);
  let pulses = [];
  let acts = layers.map((n) => Array(n).fill(0));
  let actName = "relu";

  function initWeights(ls) {
    const out = [];
    for (let l = 0; l < ls.length - 1; l++) {
      const m = [];
      for (let j = 0; j < ls[l + 1]; j++) {
        m.push(Array.from({ length: ls[l] }, () => (Math.random() * 2 - 1) * 1.2));
      }
      out.push(m);
    }
    return out;
  }

  function act(z) {
    if (actName === "sigmoid") return 1 / (1 + Math.exp(-z));
    if (actName === "tanh") return Math.tanh(z);
    return Math.max(0, z);
  }

  function forward(x) {
    acts[0] = [...x];
    for (let l = 0; l < W.length; l++) {
      acts[l + 1] = W[l].map((row) => act(row.reduce((s, w, i) => s + w * acts[l][i], 0)));
    }
    return acts[acts.length - 1][0];
  }

  function rebuild() {
    layers = [2, Number(root.querySelector("#h1").value), Number(root.querySelector("#h2").value), 1];
    W = initWeights(layers);
    acts = layers.map((n) => Array(n).fill(0));
  }

  function positions() {
    const { w, h } = cssSize();
    const pad = 48;
    const pts = [];
    layers.forEach((n, li) => {
      const x = pad + (li / (layers.length - 1)) * (w - pad * 2);
      for (let i = 0; i < n; i++) {
        const y = pad + ((i + 0.5) / n) * (h - pad * 2);
        pts.push({ x, y, li, i });
      }
    });
    return pts;
  }

  function spawnPulses() {
    pulses = [];
    const pts = positions();
    for (let l = 0; l < layers.length - 1; l++) {
      for (let i = 0; i < layers[l]; i++) {
        for (let j = 0; j < layers[l + 1]; j++) {
          const a = pts.find((p) => p.li === l && p.i === i);
          const b = pts.find((p) => p.li === l + 1 && p.i === j);
          pulses.push({ a, b, t: -(l * 18 + i * 3), speed: 0.045, w: W[l][j][i] });
        }
      }
    }
  }

  function draw() {
    const { w, h } = cssSize();
    ctx.clearRect(0, 0, w, h);
    const pts = positions();
    W.forEach((mat, l) => {
      mat.forEach((row, j) => {
        row.forEach((wt, i) => {
          const a = pts.find((p) => p.li === l && p.i === i);
          const b = pts.find((p) => p.li === l + 1 && p.i === j);
          ctx.strokeStyle = wt >= 0 ? "rgba(212,165,116,0.35)" : "rgba(239,123,108,0.35)";
          ctx.lineWidth = 0.6 + Math.min(3, Math.abs(wt));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
      });
    });

    pulses.forEach((p) => {
      p.t += p.speed;
      if (p.t < 0 || p.t > 1) return;
      const x = lerp(p.a.x, p.b.x, p.t);
      const y = lerp(p.a.y, p.b.y, p.t);
      ctx.fillStyle = p.w >= 0 ? "#6ee0c4" : "#ef7b6c";
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    pts.forEach((p) => {
      const a = acts[p.li][p.i];
      const show = actName === "tanh" ? (a + 1) / 2 : Math.abs(a);
      ctx.beginPath();
      ctx.fillStyle = `rgba(110,224,196,${0.15 + 0.7 * Math.min(1, show)})`;
      ctx.arc(p.x, p.y, 11 + Math.min(1, show) * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0ece4";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "#f0ece4";
      ctx.font = "11px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(a.toFixed(2), p.x, p.y + 26);
    });
  }

  const x1 = root.querySelector("#x1");
  const x2 = root.querySelector("#x2");
  const outline = root.querySelector("#outline");

  function update(sendPulse) {
    const x = [Number(x1.value), Number(x2.value)];
    root.querySelector("#x1v").textContent = x[0].toFixed(2);
    root.querySelector("#x2v").textContent = x[1].toFixed(2);
    const y = forward(x);
    outline.innerHTML = `Architecture [${layers.join(" → ")}] · output ≈ <span class="stat">${y.toFixed(3)}</span>`;
    if (sendPulse) spawnPulses();
  }

  x1.oninput = () => update(true);
  x2.oninput = () => update(true);
  root.querySelector("#h1").oninput = (e) => {
    root.querySelector("#h1v").textContent = e.target.value;
  };
  root.querySelector("#h2").oninput = (e) => {
    root.querySelector("#h2v").textContent = e.target.value;
  };
  root.querySelector("#h1").onchange = () => {
    rebuild();
    update(true);
  };
  root.querySelector("#h2").onchange = () => {
    rebuild();
    update(true);
  };
  root.querySelector("#act").onchange = (e) => {
    actName = e.target.value;
    update(true);
  };
  root.querySelector("#pulse").onclick = () => update(true);
  root.querySelector("#shuffle").onclick = () => {
    W = initWeights(layers);
    update(true);
  };

  update(true);
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

import { labShell, setupCanvas, lerp } from "../ui.js";

const VOCAB = {
  The: [1, 0, 0, 0, 0],
  cat: [0, 1, 0, 0, 0],
  sat: [0, 0, 1, 0, 0],
  on: [0, 0, 0, 1, 0],
  mat: [0, 0, 0, 0, 1],
};
const SEQ = ["The", "cat", "sat", "on", "mat"];

function tanh(z) {
  return Math.tanh(z);
}

export function mountRnn(root) {
  const { canvas } = labShell(root, {
    title: "Recurrent network",
    kicker: "Memory through time",
    body: "An RNN reuses one cell. At time t it reads the next word and its previous hidden state. That loop is memory: “cat” still influences the state when we reach “mat”. Unrolling the loop shows the same weights at every step.",
    formula: "hₜ = tanh(Wₕ hₜ₋₁ + Wₓ xₜ)\nyₜ = softmax(Wᵧ hₜ)",
    controlsHtml: `
      <label class="ctrl">Speed
        <input id="spd" type="range" min="0.4" max="2.2" step="0.1" value="1" />
      </label>
      <div class="btn-row">
        <button id="play">Play sequence</button>
        <button class="ghost" id="reset">Reset</button>
      </div>
      <p class="explain" id="note"></p>
    `,
    legend: `<span><i class="swatch" style="background:#6ee0c4"></i>input xₜ</span>
             <span><i class="swatch" style="background:#b9a6ff"></i>hidden hₜ</span>
             <span><i class="swatch" style="background:#d4a574"></i>recurrent loop</span>`,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);

  const Wx = [
    [0.6, 0.1, 0.0, 0.0, 0.0],
    [0.1, 0.7, 0.2, 0.0, 0.0],
    [0.0, 0.2, 0.7, 0.1, 0.0],
  ];
  const Wh = [
    [0.5, -0.2, 0.1],
    [0.2, 0.4, -0.1],
    [0.0, 0.3, 0.6],
  ];

  let h = [0, 0, 0];
  let tIndex = 0;
  let phase = 0;
  let playing = true;
  let history = [];

  function stepCell(x, hPrev) {
    const z = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      z[i] = Wh[i].reduce((s, w, k) => s + w * hPrev[k], 0) + Wx[i].reduce((s, w, k) => s + w * x[k], 0);
    }
    return z.map(tanh);
  }

  function draw() {
    const { w, h: H } = cssSize();
    ctx.clearRect(0, 0, w, H);
    const n = SEQ.length;
    const gap = (w - 80) / n;
    SEQ.forEach((word, i) => {
      const x = 50 + i * gap;
      const y = 90;
      const active = i === tIndex;
      ctx.fillStyle = active ? "#6ee0c4" : "#2a303c";
      round(ctx, x - 28, y - 18, 56, 36, 8);
      ctx.fill();
      ctx.fillStyle = active ? "#0b0d10" : "#f0ece4";
      ctx.font = "12px Source Sans 3, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(word, x, y + 5);

      const cellY = 220;
      ctx.strokeStyle = i <= tIndex ? "#b9a6ff" : "#2a303c";
      ctx.lineWidth = 2;
      roundStroke(ctx, x - 34, cellY - 34, 68, 68, 14);

      if (i > 0) {
        ctx.strokeStyle = "#d4a574";
        ctx.beginPath();
        ctx.moveTo(x - gap + 34, cellY);
        ctx.lineTo(x - 34, cellY);
        ctx.stroke();
        ctx.fillStyle = "#d4a574";
        ctx.beginPath();
        ctx.moveTo(x - 34, cellY);
        ctx.lineTo(x - 44, cellY - 5);
        ctx.lineTo(x - 44, cellY + 5);
        ctx.fill();
      }

      if (history[i]) {
        history[i].forEach((v, k) => {
          ctx.fillStyle = `rgba(185,166,255,${0.25 + 0.7 * Math.abs(v)})`;
          ctx.fillRect(x - 22 + k * 16, cellY + 50, 12, 8 + Math.abs(v) * 28);
        });
      }
    });

    ctx.fillStyle = "#9a948a";
    ctx.textAlign = "left";
    ctx.font = "13px Source Sans 3, sans-serif";
    ctx.fillText("Unrolled through time — same cell, copied for each word.", 40, H - 48);
    ctx.fillText("Bars under a cell are the 3 hidden dimensions after that word.", 40, H - 28);

    if (playing && tIndex < n) {
      const x0 = 50 + tIndex * gap;
      const y = lerp(90, 220, phase);
      ctx.fillStyle = "#6ee0c4";
      ctx.beginPath();
      ctx.arc(x0, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function roundStroke(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  const note = root.querySelector("#note");
  const spd = root.querySelector("#spd");

  function advance() {
    const x = VOCAB[SEQ[tIndex]];
    h = stepCell(x, h);
    history[tIndex] = [...h];
    note.innerHTML = `After “${SEQ[tIndex]}”, hidden ≈ <span class="stat">[${h.map((v) => v.toFixed(2)).join(", ")}]</span>`;
    tIndex += 1;
    phase = 0;
    if (tIndex >= SEQ.length) playing = false;
  }

  root.querySelector("#play").onclick = () => {
    if (tIndex >= SEQ.length) {
      tIndex = 0;
      h = [0, 0, 0];
      history = [];
    }
    playing = true;
  };
  root.querySelector("#reset").onclick = () => {
    tIndex = 0;
    h = [0, 0, 0];
    history = [];
    playing = true;
    note.textContent = "";
  };

  let raf;
  const loop = () => {
    if (playing && tIndex < SEQ.length) {
      phase += 0.02 * Number(spd.value);
      if (phase >= 1) advance();
    }
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

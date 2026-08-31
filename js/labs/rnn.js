import { labShell, setupCanvas, lerp, themeColors } from "../ui.js";
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
function softmax(z) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function mountRnn(root) {
  const { canvas } = labShell(root, {
    title: "Recurrent network",
    kicker: "Chapter 2 · Sequences",
    body: "Watch one shared cell run through the sentence. At each step: read xₜ, mix with memory hₜ₋₁, write new hₜ, optionally emit yₜ. Step slowly to see the hidden vector change.",
    formula: "hₜ = tanh(Wₕ hₜ₋₁ + Wₓ xₜ)\nyₜ = softmax(Wᵧ hₜ)",
    guideKey: "rnn",
    notesHref: "#/notes?doc=reading-materials%2FU3%2F2026-08-08_Recommender-Systems-Time-Series%2FLecture-Notes%2FL3_RNN_Intro_V1.8.pdf",
    notesHref: "#/notes?doc=" + encodeURIComponent("reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/L3_RNN_Intro_V1.8.pdf"),
    controlsHtml: `
      <label class="ctrl">Speed <span id="spdv" class="stat">1.0×</span>
        <input id="spd" type="range" min="0.3" max="2.5" step="0.1" value="1" />
      </label>
      <label class="ctrl">Step focus <span id="tiv" class="stat">auto</span>
        <input id="tstep" type="range" min="0" max="4" step="1" value="0" />
      </label>
      <label class="ctrl fail">
        <input id="vanish" type="checkbox" /> Failure mode: shrink recurrent weights (vanishing)
      </label>
      <div class="btn-row">
        <button id="play">Play</button>
        <button id="stepBtn">One step</button>
        <button class="ghost" id="reset">Reset</button>
      </div>
      <p class="explain" id="note"></p>
    `,
    legend: `<span><i class="swatch" style="background:#6ee0c4"></i>input xₜ</span>
             <span><i class="swatch" style="background:#b9a6ff"></i>hidden hₜ</span>
             <span><i class="swatch" style="background:#d4a574"></i>recurrent</span>
             <span><i class="swatch" style="background:#ef7b6c"></i>output yₜ</span>`,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);

  const Wx0 = [
    [0.9, 0.1, 0.0, 0.0, 0.0],
    [0.1, 0.85, 0.15, 0.0, 0.0],
    [0.0, 0.15, 0.8, 0.15, 0.05],
  ];
  const Wh0 = [
    [0.75, -0.15, 0.1],
    [0.2, 0.7, -0.1],
    [0.05, 0.25, 0.72],
  ];
  const Wy = [
    [0.8, 0.1, 0.05],
    [0.1, 0.75, 0.1],
    [0.05, 0.15, 0.7],
    [0.2, 0.2, 0.2],
    [0.1, 0.1, 0.6],
  ];

  let Wx = Wx0.map((r) => r.slice());
  let Wh = Wh0.map((r) => r.slice());
  let h = [0, 0, 0];
  let tIndex = 0;
  let phase = 0;
  let playing = true;
  let history = [];
  let outs = [];
  let manual = false;

  function applyVanish(on) {
    if (on) {
      Wh = Wh0.map((r) => r.map((v) => v * 0.25));
    } else {
      Wh = Wh0.map((r) => r.slice());
    }
    Wx = Wx0.map((r) => r.slice());
  }

  function stepCell(x, hPrev) {
    const z = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      z[i] =
        Wh[i].reduce((s, w, k) => s + w * hPrev[k], 0) + Wx[i].reduce((s, w, k) => s + w * x[k], 0);
    }
    return z.map(tanh);
  }

  function emit(hVec) {
    const logits = Wy.map((row) => row.reduce((s, w, i) => s + w * hVec[i], 0));
    return softmax(logits);
  }

  function advance() {
    const x = VOCAB[SEQ[tIndex]];
    const hPrev = [...h];
    h = stepCell(x, h);
    history[tIndex] = { h: [...h], hPrev, x: [...x], y: emit(h) };
    outs[tIndex] = history[tIndex].y;
    root.querySelector("#note").innerHTML =
      `t=${tIndex} “${SEQ[tIndex]}” · h=<span class="stat">[${h.map((v) => v.toFixed(2)).join(", ")}]</span> · ` +
      `P(next≈${SEQ[outs[tIndex].indexOf(Math.max(...outs[tIndex]))]}) ` +
      `y=<span class="stat">[${outs[tIndex].map((v) => v.toFixed(2)).join(", ")}]</span>`;
    tIndex += 1;
    phase = 0;
    if (tIndex >= SEQ.length) playing = false;
  }

  function draw() {
    const C = themeColors();
    const { w, h: H } = cssSize();
    ctx.clearRect(0, 0, w, H);
    const n = SEQ.length;
    const gap = (w - 70) / n;
    const focus = manual ? Number(root.querySelector("#tstep").value) : Math.min(tIndex, n - 1);

    // title strip
    ctx.fillStyle = C.muted;
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Unrolled RNN — same cell weights at every t", 24, 22);

    SEQ.forEach((word, i) => {
      const x = 40 + i * gap;
      const wordY = 70;
      const cellY = 200;
      const active = i === (playing ? tIndex : focus) || i === tIndex;

      // word token
      ctx.fillStyle = i === tIndex ? C.teal : C.canvasSoft;
      round(ctx, x - 30, wordY - 16, 60, 32, 8);
      ctx.fill();
      ctx.fillStyle = i === tIndex ? "#0b0d10" : C.ink;
      ctx.font = "12px Source Sans 3, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(word, x, wordY + 5);

      // arrow word → cell
      ctx.strokeStyle = C.teal;
      ctx.globalAlpha = i <= tIndex ? 0.8 : 0.25;
      ctx.beginPath();
      ctx.moveTo(x, wordY + 16);
      ctx.lineTo(x, cellY - 40);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // cell
      ctx.strokeStyle = i <= tIndex ? C.violet : C.canvasSoft;
      ctx.lineWidth = active ? 3 : 1.5;
      roundStroke(ctx, x - 36, cellY - 36, 72, 72, 14);
      ctx.fillStyle = C.muted;
      ctx.font = "11px IBM Plex Mono, monospace";
      ctx.fillText(`h${i}`, x, cellY + 4);

      // recurrent arrow
      if (i > 0) {
        ctx.strokeStyle = C.brass;
        ctx.globalAlpha = i <= tIndex ? 0.9 : 0.25;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - gap + 36, cellY);
        ctx.lineTo(x - 36, cellY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 36, cellY);
        ctx.lineTo(x - 46, cellY - 5);
        ctx.lineTo(x - 46, cellY + 5);
        ctx.fillStyle = C.brass;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (i === 1) {
          ctx.fillStyle = C.brass;
          ctx.font = "11px Source Sans 3, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("hₜ₋₁", x - gap / 2, cellY - 10);
        }
      }

      // hidden bars
      if (history[i]) {
        history[i].h.forEach((v, k) => {
          const bh = Math.abs(v) * 34;
          ctx.fillStyle = v >= 0 ? C.violet : C.coral;
          ctx.globalAlpha = 0.35 + 0.65 * Math.abs(v);
          ctx.fillRect(x - 24 + k * 18, cellY + 48, 14, 8 + bh);
          ctx.globalAlpha = 1;
        });
      }

      // output distribution
      if (outs[i]) {
        const oy = H - 70;
        outs[i].forEach((p, k) => {
          ctx.fillStyle = C.coral;
          ctx.globalAlpha = 0.25 + 0.75 * p;
          ctx.fillRect(x - 28 + k * 12, oy - p * 50, 10, p * 50);
          ctx.globalAlpha = 1;
        });
        if (i === 0) {
          ctx.fillStyle = C.muted;
          ctx.font = "11px Source Sans 3, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("yₜ = softmax over vocab", 24, oy + 18);
        }
      }
    });

    // pulse during play
    if (playing && tIndex < n) {
      const x0 = 40 + tIndex * gap;
      const y = lerp(70, 200, phase);
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.arc(x0, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // detail panel for focused step
    const detail = history[focus];
    if (detail) {
      ctx.fillStyle = C.muted;
      ctx.font = "12px Source Sans 3, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `Focus t=${focus} “${SEQ[focus]}”: mix Wₓ·x + Wₕ·h_prev → tanh → h`,
        24,
        H - 28
      );
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

  const spd = root.querySelector("#spd");
  spd.oninput = () => {
    root.querySelector("#spdv").textContent = `${Number(spd.value).toFixed(1)}×`;
  };
  root.querySelector("#tstep").oninput = (e) => {
    manual = true;
    playing = false;
    root.querySelector("#tiv").textContent = e.target.value;
    // ensure history filled up to that step
    while (tIndex <= Number(e.target.value) && tIndex < SEQ.length) advance();
  };
  root.querySelector("#vanish").onchange = (e) => {
    applyVanish(e.target.checked);
    root.querySelector("#reset").click();
  };
  root.querySelector("#play").onclick = () => {
    manual = false;
    if (tIndex >= SEQ.length) root.querySelector("#reset").click();
    playing = true;
    root.querySelector("#tiv").textContent = "auto";
  };
  root.querySelector("#stepBtn").onclick = () => {
    playing = false;
    manual = true;
    if (tIndex < SEQ.length) advance();
    root.querySelector("#tstep").value = String(Math.max(0, tIndex - 1));
    root.querySelector("#tiv").textContent = root.querySelector("#tstep").value;
  };
  root.querySelector("#reset").onclick = () => {
    tIndex = 0;
    h = [0, 0, 0];
    history = [];
    outs = [];
    phase = 0;
    playing = true;
    manual = false;
    root.querySelector("#note").textContent = "";
    root.querySelector("#tiv").textContent = "auto";
  };

  let raf;
  const loop = () => {
    if (playing && tIndex < SEQ.length) {
      phase += 0.018 * Number(spd.value);
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

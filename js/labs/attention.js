import { labShell, setupCanvas } from "../ui.js";

const TOKENS = ["The", "cat", "sat", "on", "mat"];

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

function makeQKV() {
  return TOKENS.map((_, i) => ({
    q: [Math.cos((i / 5) * Math.PI), Math.sin((i / 5) * Math.PI * 0.6)],
    k: [Math.cos((i / 5) * Math.PI + 0.2), Math.sin((i / 4) * Math.PI)],
    v: [0.2 + i * 0.15, 0.8 - i * 0.1, 0.3],
  }));
}

export function mountAttention(root) {
  const { canvas } = labShell(root, {
    title: "Attention",
    kicker: "Who listens to whom",
    body: "Each token has a query, key, and value. The query of the selected word is dotted with every key. Softmax turns those scores into a distribution: how much this word should read from each other word. The output is a mix of the values.",
    formula: "α = softmax(QKᵀ / √d)\noutput = α V",
    guideKey: "attention",
    controlsHtml: `
      <label class="ctrl">Query token
        <input id="qi" type="range" min="0" max="4" step="1" value="1" />
      </label>
      <p class="explain" id="msg"></p>
    `,
    legend: `<span>Brighter cell = more attention from the query row to that key.</span>`,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const qkv = makeQKV();

  function scores(qi) {
    const d = Math.sqrt(2);
    return qkv.map((other) => (qkv[qi].q[0] * other.k[0] + qkv[qi].q[1] * other.k[1]) / d);
  }

  function draw() {
    const qi = Number(root.querySelector("#qi").value);
    const sc = scores(qi);
    const att = softmax(sc);
    const { w, h } = cssSize();
    ctx.clearRect(0, 0, w, h);
    const cell = Math.min(64, (w - 120) / 6);
    const ox = 90;
    const oy = 70;

    ctx.fillStyle = "#9a948a";
    ctx.font = "12px Source Sans 3, sans-serif";
    ctx.textAlign = "center";
    TOKENS.forEach((t, j) => {
      ctx.fillText(t, ox + (j + 0.5) * cell, oy - 12);
      ctx.save();
      ctx.translate(ox - 16, oy + (j + 0.6) * cell);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(t, 0, 0);
      ctx.restore();
    });

    TOKENS.forEach((_, i) => {
      const rowScores = softmax(scores(i));
      TOKENS.forEach((_, j) => {
        const a = rowScores[j];
        ctx.fillStyle = `rgba(110,224,196,${0.12 + a * 0.88})`;
        ctx.fillRect(ox + j * cell, oy + i * cell, cell - 3, cell - 3);
        ctx.fillStyle = "#0b0d10";
        ctx.font = "11px IBM Plex Mono, monospace";
        ctx.fillText(a.toFixed(2), ox + j * cell + cell / 2, oy + i * cell + cell / 2);
      });
    });

    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy + qi * cell, cell * 5 - 3, cell - 3);

    const mix = [0, 0, 0];
    att.forEach((a, j) => {
      mix[0] += a * qkv[j].v[0];
      mix[1] += a * qkv[j].v[1];
      mix[2] += a * qkv[j].v[2];
    });

    root.querySelector("#msg").innerHTML = `Query is “${TOKENS[qi]}”. Attention mix of values ≈ <span class="stat">[${mix.map((v) => v.toFixed(2)).join(", ")}]</span>`;

    ctx.fillStyle = "#9a948a";
    ctx.textAlign = "left";
    ctx.font = "13px Source Sans 3, sans-serif";
    ctx.fillText("Rows = query token, columns = key token. Gold box is the selected query.", ox, oy + cell * 5 + 28);
  }

  root.querySelector("#qi").oninput = draw;
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

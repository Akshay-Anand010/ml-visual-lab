import { labShell, setupCanvas } from "../ui.js";

const CORPUS = "the cat sat on the mat the dog sat on the log cat and dog";
const WINDOW = 2;

function tokens(s) {
  return s.toLowerCase().split(/\s+/).filter(Boolean);
}

function skipPairs(seq, w) {
  const pairs = [];
  for (let i = 0; i < seq.length; i++) {
    for (let d = 1; d <= w; d++) {
      if (i - d >= 0) pairs.push([seq[i], seq[i - d]]);
      if (i + d < seq.length) pairs.push([seq[i], seq[i + d]]);
    }
  }
  return pairs;
}

export function mountWord2Vec(root) {
  const { canvas } = labShell(root, {
    title: "Word2Vec (skip-gram)",
    kicker: "Words that live together",
    body: "Skip-gram: given a center word, predict its neighbors. Training pulls the center embedding toward real context words and slightly away from random “negative” words. After a few hundred steps, similar words sit nearer in this 2D map.",
    formula: "center · context  ↑  for true pairs\ncenter · negative  ↓  for noise samples",
    controlsHtml: `
      <label class="ctrl">Learning rate
        <input id="lr" type="range" min="0.02" max="0.25" step="0.01" value="0.08" />
      </label>
      <div class="btn-row">
        <button id="train">Train</button>
        <button class="ghost" id="pause">Pause</button>
        <button class="ghost" id="reset">Reshuffle</button>
      </div>
      <p class="explain" id="pair"></p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const seq = tokens(CORPUS);
  const vocab = [...new Set(seq)];
  const pairs = skipPairs(seq, WINDOW);
  let vec = Object.fromEntries(vocab.map((w) => [w, [Math.random() * 2 - 1, Math.random() * 2 - 1]]));
  let running = true;
  let steps = 0;
  let current = pairs[0];

  function trainStep(lr) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    current = pair;
    const [c, o] = pair;
    const neg = vocab[Math.floor(Math.random() * vocab.length)];
    const vc = vec[c];
    const vo = vec[o];
    const vn = vec[neg];
    vc[0] += lr * vo[0];
    vc[1] += lr * vo[1];
    vo[0] += lr * 0.5 * vc[0];
    vo[1] += lr * 0.5 * vc[1];
    vn[0] -= lr * 0.35 * vc[0];
    vn[1] -= lr * 0.35 * vc[1];
    Object.values(vec).forEach((v) => {
      const n = Math.hypot(v[0], v[1]) || 1;
      if (n > 2.4) {
        v[0] = (v[0] / n) * 2.4;
        v[1] = (v[1] / n) * 2.4;
      }
    });
    steps += 1;
  }

  function draw() {
    const { w, h } = cssSize();
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(240,236,228,0.08)";
    ctx.beginPath();
    ctx.moveTo(40, h / 2);
    ctx.lineTo(w - 40, h / 2);
    ctx.moveTo(w / 2, 30);
    ctx.lineTo(w / 2, h - 30);
    ctx.stroke();

    if (current) {
      const a = project(vec[current[0]], w, h);
      const b = project(vec[current[1]], w, h);
      ctx.strokeStyle = "rgba(110,224,196,0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    vocab.forEach((word) => {
      const p = project(vec[word], w, h);
      const hot = current && (word === current[0] || word === current[1]);
      ctx.fillStyle = hot ? "#6ee0c4" : "#d4a574";
      ctx.beginPath();
      ctx.arc(p.x, p.y, hot ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0ece4";
      ctx.font = "13px Source Sans 3, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(word, p.x + 8, p.y - 6);
    });

    ctx.fillStyle = "#9a948a";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`steps ${steps}`, 24, 24);
  }

  function project(v, w, h) {
    return { x: w / 2 + v[0] * (w * 0.18), y: h / 2 - v[1] * (h * 0.18) };
  }

  const pairEl = root.querySelector("#pair");
  root.querySelector("#train").onclick = () => {
    running = true;
  };
  root.querySelector("#pause").onclick = () => {
    running = false;
  };
  root.querySelector("#reset").onclick = () => {
    vec = Object.fromEntries(vocab.map((w) => [w, [Math.random() * 2 - 1, Math.random() * 2 - 1]]));
    steps = 0;
  };

  let raf;
  const loop = () => {
    const lr = Number(root.querySelector("#lr").value);
    if (running) {
      for (let i = 0; i < 4; i++) trainStep(lr);
      pairEl.innerHTML = `Skip-gram pair: <span class="stat">${current[0]} → ${current[1]}</span> (center predicts context)`;
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

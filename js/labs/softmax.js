import { labShell, setupCanvas, setInspect, paintStage } from "../ui.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

export function mountSoftmax(root) {
  const { canvas, inspect } = labShell(root, {
    title: "Softmax",
    kicker: "Chapter 1 · Probabilities",
    body: "Logits are free scores. Softmax turns them into a probability distribution that always sums to 1 — the last layer of most classifiers. Temperature sharpens or flattens the distribution.",
    formula: "pᵢ = exp(zᵢ / T) / Σⱼ exp(zⱼ / T)",
    guideKey: "softmax",
    bannerHtml: pathBannerHtml("path-softmax"),
    controlsHtml: `
      <label class="ctrl">z₀ (class A) <span id="z0v" class="stat">1.2</span>
        <input id="z0" type="range" min="-3" max="3" step="0.05" value="1.2" />
      </label>
      <label class="ctrl">z₁ (class B) <span id="z1v" class="stat">0.2</span>
        <input id="z1" type="range" min="-3" max="3" step="0.05" value="0.2" />
      </label>
      <label class="ctrl">z₂ (class C) <span id="z2v" class="stat">-0.6</span>
        <input id="z2" type="range" min="-3" max="3" step="0.05" value="-0.6" />
      </label>
      <label class="ctrl">Temperature T <span id="tv" class="stat">1.00</span>
        <input id="temp" type="range" min="0.2" max="3" step="0.05" value="1" />
      </label>
      <p class="explain" id="status"></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  const labels = ["A", "B", "C"];

  function values() {
    return [0, 1, 2].map((i) => Number(root.querySelector(`#z${i}`).value));
  }

  function draw() {
    const z = values();
    const T = Number(root.querySelector("#temp").value);
    const p = softmax(z.map((v) => v / T));
    const { w: W, h: H } = cssSize();
    const C = paintStage(ctx, W, H);

    const barW = Math.min(120, (W - 80) / 3 - 20);
    p.forEach((pi, i) => {
      const x = 50 + i * ((W - 80) / 3);
      const bh = pi * (H - 140);
      ctx.fillStyle = [C.teal, C.brass, C.violet][i];
      ctx.fillRect(x, H - 60 - bh, barW, bh);
      ctx.fillStyle = C.ink;
      ctx.font = "14px Source Sans 3, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`class ${labels[i]}`, x + barW / 2, H - 36);
      ctx.font = "13px IBM Plex Mono, monospace";
      ctx.fillText(pi.toFixed(3), x + barW / 2, H - 70 - bh);
      ctx.fillStyle = C.muted;
      ctx.fillText(`z=${z[i].toFixed(2)}`, x + barW / 2, H - 18);
    });

    const sum = p.reduce((a, b) => a + b, 0);
    root.querySelector("#status").innerHTML =
      `Σ p = <span class="stat">${sum.toFixed(4)}</span> · argmax = class <span class="stat">${labels[p.indexOf(Math.max(...p))]}</span>`;
    setInspect(
      inspect,
      `Cross-entropy to one-hot A would be −log(p₀)=${(-Math.log(p[0] + 1e-9)).toFixed(3)}`
    );
  }

  [0, 1, 2].forEach((i) => {
    root.querySelector(`#z${i}`).oninput = (e) => {
      root.querySelector(`#z${i}v`).textContent = Number(e.target.value).toFixed(2);
    };
  });
  root.querySelector("#temp").oninput = (e) => {
    root.querySelector("#tv").textContent = Number(e.target.value).toFixed(2);
  };

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

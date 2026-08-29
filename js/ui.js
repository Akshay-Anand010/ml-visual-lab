export function labShell(root, { title, kicker, body, formula, controlsHtml, legend }) {
  root.innerHTML = `
    <article class="lab">
      <aside class="panel">
        <div class="kicker">${kicker}</div>
        <h1>${title}</h1>
        <p>${body}</p>
        <pre class="formula">${formula}</pre>
        <div class="controls">${controlsHtml}</div>
        ${legend ? `<div class="legend">${legend}</div>` : ""}
      </aside>
      <section class="panel stage">
        <canvas id="viz"></canvas>
        <div id="extra"></div>
      </section>
    </article>
  `;
  const canvas = root.querySelector("#viz");
  const extra = root.querySelector("#extra");
  return { canvas, extra, root };
}

export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, rect.width - 8);
    const h = Math.max(420, rect.height - 8);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  return { ctx, resize, cssSize: () => ({ w: canvas.clientWidth, h: canvas.clientHeight }) };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

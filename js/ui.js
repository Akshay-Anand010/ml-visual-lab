export function labShell(root, { title, kicker, body, formula, controlsHtml, legend, bannerHtml = "" }) {
  root.innerHTML = `
    <article class="lab">
      <aside class="panel">
        <div class="kicker">${kicker}</div>
        <h1>${title}</h1>
        <p>${body}</p>
        ${bannerHtml}
        <pre class="formula">${formula}</pre>
        <div class="controls">${controlsHtml}</div>
        ${legend ? `<div class="legend">${legend}</div>` : ""}
        <p class="inspect" id="inspect" hidden></p>
      </aside>
      <section class="panel stage">
        <canvas id="viz"></canvas>
        <div id="extra"></div>
      </section>
    </article>
  `;
  const canvas = root.querySelector("#viz");
  const extra = root.querySelector("#extra");
  const inspect = root.querySelector("#inspect");
  return { canvas, extra, root, inspect };
}

export function setInspect(el, html) {
  if (!el) return;
  if (!html) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.hidden = false;
  el.innerHTML = html;
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

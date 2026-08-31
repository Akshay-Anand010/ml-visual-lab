import { LAB_GUIDES } from "./guides.js";

export function labShell(
  root,
  { title, kicker, body, formula, controlsHtml, legend, bannerHtml = "", guideKey = null, notesHref = null }
) {
  const guide = guideKey ? LAB_GUIDES[guideKey] : null;
  const guideBlock = guide
    ? `
    <details class="lab-more">
      <summary>Simple explanation &amp; best links</summary>
      <p class="guide-simple">${guide.simple}</p>
      <ul class="guide-bullets">${guide.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
      <div class="guide-links">
        ${guide.links
          .map(
            (l) =>
              `<a class="btn-link ghost" href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
          )
          .join("")}
      </div>
      ${
        notesHref
          ? `<p class="explain" style="margin-top:0.65rem"><a class="ext" href="${notesHref}">Related notes (in-site reader) →</a></p>`
          : ""
      }
    </details>`
    : notesHref
      ? `<p class="explain"><a class="ext" href="${notesHref}">Related notes →</a></p>`
      : "";

  root.innerHTML = `
    <article class="lab">
      <aside class="panel">
        <div class="kicker">${kicker}</div>
        <h1>${title}</h1>
        <p>${body}</p>
        ${bannerHtml}
        ${guideBlock}
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
    const narrow = window.innerWidth < 720;
    const w = Math.max(narrow ? 220 : 320, Math.floor(rect.width - 8));
    const h = Math.max(narrow ? 260 : 420, Math.floor(rect.height - 8));
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

export function themeColors() {
  const s = getComputedStyle(document.documentElement);
  const g = (n, d) => s.getPropertyValue(n).trim() || d;
  return {
    light: document.documentElement.getAttribute("data-theme") === "light",
    ink: g("--ink", "#f0ece4"),
    muted: g("--muted", "#9a948a"),
    brass: g("--brass", "#d4a574"),
    teal: g("--teal", "#6ee0c4"),
    coral: g("--coral", "#ef7b6c"),
    violet: g("--violet", "#b9a6ff"),
    paper: g("--paper", "#1a1e27"),
    field: g("--field", "#10141c"),
    line: g("--line", "rgba(240,236,228,0.1)"),
    grid: g("--grid", "rgba(240,236,228,0.12)"),
    canvasSoft: g("--canvas-soft", "#2a303c"),
    onFill: g("--on-fill", "#14110c"),
  };
}

export function paintStage(ctx, w, h) {
  const C = themeColors();
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  return C;
}

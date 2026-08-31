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

export function themeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    ink: s.getPropertyValue("--ink").trim() || "#f0ece4",
    muted: s.getPropertyValue("--muted").trim() || "#9a948a",
    brass: s.getPropertyValue("--brass").trim() || "#d4a574",
    teal: s.getPropertyValue("--teal").trim() || "#6ee0c4",
    coral: s.getPropertyValue("--coral").trim() || "#ef7b6c",
    violet: s.getPropertyValue("--violet").trim() || "#b9a6ff",
    paper: s.getPropertyValue("--paper").trim() || "#1a1e27",
    line: s.getPropertyValue("--line").trim() || "rgba(240,236,228,0.1)",
    canvasSoft: s.getPropertyValue("--canvas-soft").trim() || "#2a303c",
  };
}

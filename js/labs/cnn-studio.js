import { mountNet3d } from "./cnn-net3d.js";

const API_KEY = "mlvl-cnn-api";

function defaultApi() {
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  if (q.get("api")) return q.get("api");
  const saved = localStorage.getItem(API_KEY);
  const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (saved && !(saved.includes("localhost") && !local)) return saved;
  return "";
}

function setApi(url) {
  localStorage.setItem(API_KEY, url.replace(/\/$/, ""));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function localPreview(file, n) {
  const blobUrl = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = blobUrl;
  });
  const size = 192;
  const out = [];
  for (let k = 0; k < n; k++) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const rot = ((k % 11) - 5) * 0.028;
    const sc = 0.9 + (k % 7) * 0.02;
    ctx.filter = `brightness(${0.86 + (k % 5) * 0.07}) contrast(${1.02 + (k % 4) * 0.05}) saturate(${0.88 + (k % 6) * 0.05})`;
    ctx.translate(size / 2 + Math.sin(k * 1.7) * 8, size / 2 + Math.cos(k * 1.3) * 6);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, -size / 2, -size / 2, size, size);
    out.push(c.toDataURL("image/jpeg", 0.82));
  }
  URL.revokeObjectURL(blobUrl);
  return out;
}

async function callApi(file, n, seed, apiBase) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("n", String(n));
  fd.append("seed", String(seed));
  const res = await fetch(`${apiBase}/api/samples`, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 180) || res.statusText);
  }
  return res.json();
}

function downloadUrl(href, name) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

export function mountCnnStudio(root) {
  const state = {
    file: null,
    preview: "",
    samples: [],
    status: "Served by FastAPI, Generate hits this same host. On GitHub Pages, paste your Render URL.",
    statusKind: "",
    n: 64,
    source: "",
  };

  root.innerHTML = `<div id="studioRoot"></div><div id="net3dHost"></div>`;
  const box = root.querySelector("#studioRoot");
  const stop3d = mountNet3d(root.querySelector("#net3dHost"));

  const paint = () => {
    const api = defaultApi();
    box.innerHTML = `
      <section class="studio">
        <div class="studio-hero">
          <div>
            <div class="kicker">Live CNN · identity views</div>
            <h1>One photo. Fifty to a hundred faces of the same person.</h1>
            <p class="lede">
              A tiny convolutional encoder reads your image, then a spatial-transformer CNN
              samples pose, light, and micro-warp — the pixels stay you, the views change.
            </p>
          </div>
          <div class="studio-stats">
            <div><span>~180k</span><small>params</small></div>
            <div><span>50–128</span><small>views</small></div>
            <div><span>CPU</span><small>FastAPI</small></div>
          </div>
        </div>

        <div class="studio-layout">
          <aside class="studio-panel">
            <label class="drop ${state.preview ? "has-img" : ""}" id="drop">
              <input id="file" type="file" accept="image/*" hidden />
              ${
                state.preview
                  ? `<img id="previewImg" alt="Upload" src="${state.preview}" />`
                  : `<div class="drop-preview">
                       <div class="drop-orb" aria-hidden="true"></div>
                       <strong>Drop a portrait</strong>
                       <span>or click · jpeg / png / webp</span>
                     </div>`
              }
            </label>
            <label class="ctrl">
              <span>Views <b id="nVal">${state.n}</b></span>
              <input id="n" type="range" min="50" max="128" value="${state.n}" />
              <small class="hint">The API may cap this from image sharpness so the page stays fast.</small>
            </label>
            <label class="ctrl">
              <span>FastAPI origin</span>
              <input id="api" type="url" value="${api}" placeholder="same origin (FastAPI) or https://….onrender.com" spellcheck="false" />
            </label>
            <div class="studio-actions">
              <button type="button" class="btn-link solid" id="go" ${state.file ? "" : "disabled"}>Generate views</button>
              <button type="button" class="btn-link ghost" id="dl" ${state.samples.length ? "" : "disabled"}>Save first 12</button>
            </div>
            <p class="studio-status ${state.statusKind}" id="status">${state.status}</p>
            <pre class="formula studio-formula">z = Enc(x)
θ ~ 𝒩(μ(z), σ(z))
x̃ = Color(GridSample(x, Affine(θ)))</pre>
          </aside>
          <section class="panel studio-stage">
            ${
              state.samples.length
                ? `<div class="studio-toolbar"><span>${state.samples.length} views${state.source ? " · " + state.source : ""}</span><span>click a tile to save</span></div>
                   <div class="studio-grid">${state.samples
                     .map(
                       (src, i) =>
                         `<button type="button" class="tile" data-i="${i}" style="animation-delay:${Math.min(i, 48) * 16}ms"><img alt="view ${i + 1}" src="${src}" /><span>${String(i + 1).padStart(2, "0")}</span></button>`
                     )
                     .join("")}</div>`
                : `<div class="studio-empty">
                     <div class="drop-orb"></div>
                     <p>Your gallery lands here — a fluid grid of CNN samples.</p>
                   </div>`
            }
          </section>
        </div>
        <div class="lightbox" id="light" hidden>
          <button type="button" class="lightbox-x" id="lightx" aria-label="Close">×</button>
          <img id="lightimg" alt="Full view" />
        </div>
      </section>
    `;

    const drop = box.querySelector("#drop");
    const input = box.querySelector("#file");
    const nEl = box.querySelector("#n");
    const apiEl = box.querySelector("#api");
    const go = box.querySelector("#go");
    const light = box.querySelector("#light");

    const takeFile = async (f) => {
      if (!f || !f.type.startsWith("image/")) return;
      state.file = f;
      state.preview = await fileToDataUrl(f);
      state.samples = [];
      state.source = "";
      state.status = `Ready · ${f.name}`;
      state.statusKind = "ok";
      paint();
    };

    drop.addEventListener("click", () => input.click());
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("hot");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("hot"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("hot");
      takeFile(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", () => takeFile(input.files[0]));
    nEl.addEventListener("input", () => {
      state.n = Number(nEl.value);
      const v = box.querySelector("#nVal");
      if (v) v.textContent = String(state.n);
    });
    apiEl.addEventListener("change", () => setApi(apiEl.value.trim()));

    go.addEventListener("click", async () => {
      if (!state.file) return;
      setApi(apiEl.value.trim());
      const api = defaultApi();
      go.disabled = true;
      state.status = "Encoding through SampleCNN…";
      state.statusKind = "busy";
      box.querySelector("#status").textContent = state.status;
      box.querySelector("#status").className = "studio-status busy";
      const t0 = performance.now();
      try {
        const data = await callApi(state.file, state.n, Date.now() % 99991, api);
        state.samples = data.samples || [];
        const ms = Math.round(performance.now() - t0);
        state.source = "CNN";
        state.status = `CNN returned ${data.count} views in ${ms} ms · ‖z‖=${data.latent_norm}${
          data.trained_weights ? " · Colab weights loaded" : " · calibrated prior (drop cnn_studio.pt in after Colab)"
        }`;
        state.statusKind = "ok";
        paint();
      } catch (err) {
        try {
          state.samples = await localPreview(state.file, state.n);
          state.source = "browser preview";
          state.status = `API unreachable (${err.message}). Local preview only — start uvicorn in /server, then Generate again.`;
          state.statusKind = "err";
          paint();
        } catch {
          go.disabled = false;
          state.statusKind = "err";
          state.status = String(err.message);
        }
      }
    });

    box.querySelector("#dl")?.addEventListener("click", () => {
      state.samples.slice(0, 12).forEach((src, i) => downloadUrl(src, `cnn-view-${i + 1}.jpg`));
    });

    box.querySelectorAll(".tile").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.i);
        const im = box.querySelector("#lightimg");
        im.src = state.samples[i];
        light.hidden = false;
      });
    });
    box.querySelector("#lightx")?.addEventListener("click", () => {
      light.hidden = true;
    });
    light.addEventListener("click", (e) => {
      if (e.target === light) light.hidden = true;
    });
  };

  paint();
  return () => {
    stop3d();
    root.innerHTML = "";
  };
}

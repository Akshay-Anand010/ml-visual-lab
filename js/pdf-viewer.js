import { remotePdfUrl } from "./pdf-remote.js";

let pdfjsPromise = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs"
    ).then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * Mount a page-by-page PDF viewer inside `host`.
 * Returns { setSource(path), destroy() }.
 */
export function createPdfViewer(host) {
  let pdfDoc = null;
  let pageNum = 1;
  let loadingTask = null;
  let destroyed = false;

  host.innerHTML = `
    <div class="pdf-viewer">
      <div class="pdf-toolbar">
        <button type="button" class="ghost" data-act="prev" disabled>← Prev</button>
        <span class="pdf-page-label">No document</span>
        <button type="button" class="ghost" data-act="next" disabled>Next →</button>
        <button type="button" class="ghost" data-act="zoomout">−</button>
        <button type="button" class="ghost" data-act="zoomin">+</button>
      </div>
      <div class="pdf-scroll">
        <div class="pdf-status">Select a note to read it here. Files stream from GitHub via CDN — nothing is stored in this site’s repo.</div>
        <canvas class="pdf-canvas" hidden></canvas>
      </div>
    </div>
  `;

  const canvas = host.querySelector(".pdf-canvas");
  const ctx = canvas.getContext("2d");
  const status = host.querySelector(".pdf-status");
  const label = host.querySelector(".pdf-page-label");
  const btnPrev = host.querySelector('[data-act="prev"]');
  const btnNext = host.querySelector('[data-act="next"]');
  let scale = 1.15;

  async function renderPage() {
    if (!pdfDoc || destroyed) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await page.render({ canvasContext: ctx, viewport }).promise;
    label.textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;
    btnPrev.disabled = pageNum <= 1;
    btnNext.disabled = pageNum >= pdfDoc.numPages;
  }

  async function setSource(path) {
    if (destroyed) return;
    status.hidden = false;
    status.textContent = "Loading PDF…";
    canvas.hidden = true;
    btnPrev.disabled = true;
    btnNext.disabled = true;
    label.textContent = "Loading…";

    if (loadingTask) {
      try {
        loadingTask.destroy();
      } catch {
        /* ignore */
      }
    }
    if (pdfDoc) {
      try {
        pdfDoc.destroy();
      } catch {
        /* ignore */
      }
      pdfDoc = null;
    }

    try {
      const pdfjs = await loadPdfJs();
      const url = remotePdfUrl(path);
      loadingTask = pdfjs.getDocument({ url, withCredentials: false });
      pdfDoc = await loadingTask.promise;
      if (destroyed) return;
      pageNum = 1;
      status.hidden = true;
      canvas.hidden = false;
      await renderPage();
    } catch (err) {
      console.error(err);
      status.hidden = false;
      canvas.hidden = true;
      status.textContent =
        "Could not load this PDF in the viewer. Use “Open on GitHub” below, or try again.";
      label.textContent = "Failed";
    }
  }

  const onClick = (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act || !pdfDoc) return;
    if (act === "prev" && pageNum > 1) {
      pageNum -= 1;
      renderPage();
    }
    if (act === "next" && pageNum < pdfDoc.numPages) {
      pageNum += 1;
      renderPage();
    }
    if (act === "zoomin") {
      scale = Math.min(2.4, scale + 0.15);
      renderPage();
    }
    if (act === "zoomout") {
      scale = Math.max(0.7, scale - 0.15);
      renderPage();
    }
  };
  host.addEventListener("click", onClick);

  return {
    setSource,
    destroy() {
      destroyed = true;
      host.removeEventListener("click", onClick);
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          /* ignore */
        }
      }
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch {
          /* ignore */
        }
      }
      host.innerHTML = "";
    },
  };
}

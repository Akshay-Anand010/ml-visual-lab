import { LEARNING_PATH, loadProgress, markDone, pathStats, isDone } from "./data/playground.js";

export function renderPath(root) {
  const paint = () => {
    const { done, total } = pathStats();
    const progress = loadProgress();
    root.innerHTML = `
      <section class="hero narrow">
        <div class="kicker">Guided path</div>
        <h1>One playground, many models.</h1>
        <p class="lede">
          Walk these stops in order. Several labs share the <strong>same 2D points</strong>,
          so you compare learners — not datasets. Mark a stop done when you finish its check.
        </p>
        <div class="path-progress">
          <div class="path-bar"><i style="width:${(done / total) * 100}%"></i></div>
          <span class="stat">${done} / ${total} complete</span>
        </div>
      </section>
      <section class="chapter-block">
        <ol class="path-list">
          ${LEARNING_PATH.map((step, i) => {
            const ok = !!progress[step.id];
            return `
              <li class="path-card ${ok ? "done" : ""}">
                <div class="path-num">${String(i + 1).padStart(2, "0")}</div>
                <div class="path-body">
                  <h2><a href="${step.href}">${step.title}</a></h2>
                  <p>${step.why}</p>
                  <p class="path-check"><strong>Check:</strong> ${step.check}</p>
                  <div class="btn-row">
                    <a class="btn-link solid" href="${step.href}">Open lab</a>
                    <button class="ghost mark-btn" data-id="${step.id}" ${ok ? "disabled" : ""}>
                      ${ok ? "Done" : "Mark done"}
                    </button>
                  </div>
                </div>
              </li>`;
          }).join("")}
        </ol>
        <p class="explain" style="margin-top:1rem">
          Progress is saved in this browser only (localStorage).
          <button class="ghost" id="resetPath" type="button">Reset path progress</button>
        </p>
      </section>
    `;
    root.querySelectorAll(".mark-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        markDone(btn.dataset.id);
        paint();
      });
    });
    root.querySelector("#resetPath")?.addEventListener("click", () => {
      localStorage.removeItem("mlvl-progress-v1");
      paint();
    });
  };
  paint();
  return () => {
    root.innerHTML = "";
  };
}

/** Compact banner to drop into a lab when it belongs on the path. */
export function pathBannerHtml(pathId) {
  const step = LEARNING_PATH.find((s) => s.id === pathId);
  if (!step) return "";
  const ok = isDone(pathId);
  return `
    <div class="path-banner" data-path="${pathId}">
      <div>
        <div class="kicker">Guided path</div>
        <strong>${step.title}</strong>
        <p class="path-check">${step.check}</p>
      </div>
      <button type="button" class="ghost path-mark" data-id="${pathId}" ${ok ? "disabled" : ""}>
        ${ok ? "✓ Done" : "Mark done"}
      </button>
    </div>`;
}

export function bindPathBanner(root) {
  root.querySelectorAll(".path-mark").forEach((btn) => {
    btn.addEventListener("click", () => {
      markDone(btn.dataset.id);
      btn.textContent = "✓ Done";
      btn.disabled = true;
      btn.closest(".path-banner")?.classList.add("done");
    });
  });
}

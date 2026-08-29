export function renderEvolution(root) {
  root.innerHTML = `
    <section class="hero narrow">
      <div class="kicker">Evolution map</div>
      <h1>From fitting a line to asking every token who matters.</h1>
      <p class="lede">
        A compressed history of machine learning ideas: classical predictors,
        then layered networks, then models that specialize in space, time, and language.
      </p>
    </section>

    <section class="chapter-block">
      <div class="evo-figure panel">
        <svg viewBox="0 0 960 420" role="img" aria-label="Evolution of machine learning ideas">
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stop-color="#d4a574"/>
              <stop offset="100%" stop-color="#6ee0c4"/>
            </linearGradient>
          </defs>
          <line x1="60" y1="210" x2="900" y2="210" stroke="url(#g)" stroke-width="3" />
          ${node(80, 210, "Linear &\nlogistic", "#/linreg", "fit from data")}
          ${node(260, 120, "Trees &\nensembles", "#/tree", "splits · bagging")}
          ${node(260, 300, "PCA &\nfeatures", "#/pca", "compress data")}
          ${node(460, 210, "Neural nets\n+ backprop", "#/backprop", "learn features")}
          ${node(640, 120, "CNNs", "#/cnn", "vision")}
          ${node(640, 300, "RNNs", "#/rnn", "sequences")}
          ${node(820, 210, "Attention &\ntransformers", "#/attention", "today")}
          <path d="M140 210 C190 210 210 120 230 120" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M140 210 C190 210 210 300 230 300" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M290 120 C360 120 400 210 430 210" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M290 300 C360 300 400 210 430 210" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M520 210 C570 210 590 120 610 120" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M520 210 C570 210 590 300 610 300" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M670 120 C730 120 760 210 790 210" fill="none" stroke="rgba(240,236,228,0.25)" />
          <path d="M670 300 C730 300 760 210 790 210" fill="none" stroke="rgba(240,236,228,0.25)" />
        </svg>
        <p class="explain">Click a node to open its lab. Ideas don’t replace each other — they stack. Linear models still win on small tabular data; attention didn’t erase CNNs for many vision tasks.</p>
      </div>
    </section>

    <section class="chapter-block">
      <h2 class="chapter-title">What each leap bought us</h2>
      <div class="grid tight">
        <div class="card static">
          <div class="tag">Leap A</div>
          <h2>Closed form → learning</h2>
          <p>Regression and logistic replace hand formulas with parameters fit from data.</p>
        </div>
        <div class="card static">
          <div class="tag">Leap B</div>
          <h2>Regions without a line</h2>
          <p>Trees and kernels carve weird shapes; ensembles reduce variance.</p>
        </div>
        <div class="card static">
          <div class="tag">Leap C</div>
          <h2>Features become learned</h2>
          <p>Backprop lets layers invent representations — CNNs for grids, RNNs for order.</p>
        </div>
        <div class="card static">
          <div class="tag">Leap D</div>
          <h2>Routing information</h2>
          <p>Attention lets every token choose what to read. Transformers scale that idea.</p>
        </div>
      </div>
    </section>
  `;

  root.querySelectorAll("[data-href]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      location.hash = el.getAttribute("data-href");
    });
  });

  return () => {
    root.innerHTML = "";
  };
}

function node(x, y, label, href, sub) {
  const lines = label.split("\n");
  return `
    <g data-href="${href}" class="evo-hit">
      <circle cx="${x}" cy="${y}" r="34" fill="#1a1e27" stroke="#d4a574" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="6" fill="#6ee0c4"/>
      <text x="${x}" y="${y - 48}" text-anchor="middle" fill="#f0ece4" font-family="Fraunces, Georgia, serif" font-size="15">${lines[0]}</text>
      ${lines[1] ? `<text x="${x}" y="${y - 32}" text-anchor="middle" fill="#f0ece4" font-family="Fraunces, Georgia, serif" font-size="15">${lines[1]}</text>` : ""}
      <text x="${x}" y="${y + 52}" text-anchor="middle" fill="#9a948a" font-family="IBM Plex Mono, monospace" font-size="11">${sub}</text>
    </g>`;
}

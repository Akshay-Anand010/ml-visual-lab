import { pathStats } from "./data/playground.js";

function card(href, n, title, body) {
  return `<a class="card" href="${href}">
    <div class="tag">${n}</div>
    <h2>${title}</h2>
    <p>${body}</p>
  </a>`;
}

export function renderHome(root) {
  const { done, total } = pathStats();
  root.innerHTML = `
    <section class="hero">
      <div class="kicker">Interactive observatory</div>
      <h1>Watch machine learning happen, not just the equations.</h1>
      <p class="lede">
        Start with the guided path — several labs share one 2D playground so you compare models, not datasets.
        Step, scrub, and inspect weights. Break things on purpose (dead ReLUs, overfit trees).
      </p>
      <div class="hero-actions">
        <a class="btn-link solid" href="#/path">Guided path (${done}/${total})</a>
        <a class="btn-link" href="#/evolution">Evolution map</a>
        <a class="btn-link ghost" href="#/notes">Notes</a>
      </div>
    </section>

    <section class="chapter-block">
      <div class="chapter-head">
        <div>
          <div class="kicker">Shared playground</div>
          <h2 class="chapter-title">Same points · different learners</h2>
        </div>
        <a class="btn-link" href="#/path">Start path →</a>
      </div>
      <p class="chapter-lede">Logistic, k-NN, and the decision tree all use seed-controlled identical blobs. Change the seed in one lab, match it in another.</p>
      <div class="grid tight">
        ${card("#/landscape", "0", "Loss landscape", "Ball on a bowl or saddle — what η really does.")}
        ${card("#/logreg", "1", "Logistic", "Linear boundary on the playground.")}
        ${card("#/knn", "2", "k-NN", "No training — vote among neighbors.")}
        ${card("#/tree", "3", "Tree", "Axis splits; raise depth to overfit.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Roadmap</div>
      <h2 class="chapter-title">How we got from lines to transformers</h2>
      <div class="evo-strip" aria-hidden="true">
        <div class="evo-node"><span>Linear models</span><small>fit a line / plane</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>Neighbors &amp; trees</span><small>local / axis splits</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>Neural nets</span><small>learned features</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>CNN / RNN</span><small>space &amp; time</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node hot"><span>Attention</span><small>today’s stack</small></div>
      </div>
      <p style="margin-top:0.8rem"><a class="btn-link" href="#/evolution">Open full figure →</a></p>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 1</div>
      <h2 class="chapter-title">Classical machine learning</h2>
      <div class="grid tight">
        ${card("#/linreg", "1.1", "Linear regression", "Step / scrub loss · tune η and noise.")}
        ${card("#/logreg", "1.2", "Logistic regression", "Shared playground · hover a point.")}
        ${card("#/knn", "1.3", "k-NN", "Shared playground · change k.")}
        ${card("#/tree", "1.4", "Decision tree", "Shared playground · overfit mode.")}
        ${card("#/pca", "1.5", "PCA", "Principal axes of a cloud.")}
        ${card("#/softmax", "1.6", "Softmax", "Logits → probabilities.")}
        ${card("#/landscape", "1.7", "Loss landscape", "Gradient descent intuition.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 2</div>
      <h2 class="chapter-title">Neural networks &amp; deep learning</h2>
      <div class="grid tight">
        ${card("#/neural", "2.1", "Neural network", "Widths, activations, dead ReLUs.")}
        ${card("#/backprop", "2.2", "Backpropagation", "Step, scrub loss, inspect weights.")}
        ${card("#/cnn", "2.3", "CNN", "Sliding kernels, ReLU, max-pool.")}
        ${card("#/rnn", "2.4", "RNN", "Hidden state through a sentence.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 3</div>
      <h2 class="chapter-title">Language &amp; attention</h2>
      <div class="grid tight">
        ${card("#/tfidf", "3.1", "TF-IDF", "Distinctive terms light up.")}
        ${card("#/word2vec", "3.2", "Word2Vec", "Skip-gram in 2D.")}
        ${card("#/attention", "3.3", "Attention", "Query–key heatmap.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="chapter-head">
        <div>
          <div class="kicker">Reference</div>
          <h2 class="chapter-title">Notes &amp; reading</h2>
        </div>
        <a class="btn-link" href="#/notes">Browse PDFs →</a>
      </div>
    </section>
  `;
  return () => {
    root.innerHTML = "";
  };
}

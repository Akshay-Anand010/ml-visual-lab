function card(href, n, title, body) {
  return `<a class="card" href="${href}">
    <div class="tag">${n}</div>
    <h2>${title}</h2>
    <p>${body}</p>
  </a>`;
}

export function renderHome(root) {
  root.innerHTML = `
    <section class="hero">
      <div class="kicker">Interactive observatory</div>
      <h1>Watch machine learning happen, not just the equations.</h1>
      <p class="lede">
        Chapters move from classical algorithms to neural nets to language and attention.
        Every lab is a small working model you can tune — epochs, learning rate, depth, noise —
        so the picture stays next to the math.
      </p>
      <div class="hero-actions">
        <a class="btn-link solid" href="#/evolution">See the evolution map</a>
        <a class="btn-link" href="#/notes">Reference notes</a>
        <a class="btn-link ghost" href="#/linreg">Start with linear regression</a>
      </div>
    </section>

    <section class="chapter-block">
      <div class="chapter-head">
        <div>
          <div class="kicker">Roadmap</div>
          <h2 class="chapter-title">How we got from lines to transformers</h2>
        </div>
        <a class="btn-link" href="#/evolution">Full figure →</a>
      </div>
      <div class="evo-strip" aria-hidden="true">
        <div class="evo-node"><span>Linear models</span><small>fit a line / plane</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>Trees &amp; kernels</span><small>non-linear regions</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>Neural nets</span><small>learned features</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node"><span>CNN / RNN</span><small>space &amp; time</small></div>
        <div class="evo-arrow">→</div>
        <div class="evo-node hot"><span>Attention</span><small>today’s stack</small></div>
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 1</div>
      <h2 class="chapter-title">Classical machine learning</h2>
      <p class="chapter-lede">Core predictors that still solve many real problems well.</p>
      <div class="grid tight">
        ${card("#/linreg", "1.1", "Linear regression", "Gradient descent fits ŷ = wx + b. Tune epochs, η, noise.")}
        ${card("#/logreg", "1.2", "Logistic regression", "Soft decision boundary for two classes. Watch accuracy climb.")}
        ${card("#/pca", "1.3", "PCA", "Principal axes of a cloud — variance explained live.")}
        ${card("#/tree", "1.4", "Decision tree", "Axis splits and depth vs overfitting.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 2</div>
      <h2 class="chapter-title">Neural networks &amp; deep learning</h2>
      <p class="chapter-lede">From a handful of neurons to convolution and recurrence.</p>
      <div class="grid tight">
        ${card("#/neural", "2.1", "Neural network", "Change width and activation; watch pulses forward.")}
        ${card("#/backprop", "2.2", "Backpropagation", "XOR trainer with epoch budget, hidden size, learning rate.")}
        ${card("#/cnn", "2.3", "CNN", "Sliding kernels, ReLU, max-pool.")}
        ${card("#/rnn", "2.4", "RNN", "Hidden state looping through a short sentence.")}
      </div>
    </section>

    <section class="chapter-block">
      <div class="kicker">Chapter 3</div>
      <h2 class="chapter-title">Language &amp; attention</h2>
      <p class="chapter-lede">From bag-of-words style weights to embeddings and who-listens-to-whom.</p>
      <div class="grid tight">
        ${card("#/tfidf", "3.1", "TF-IDF", "Edit documents; distinctive terms light up.")}
        ${card("#/word2vec", "3.2", "Word2Vec", "Skip-gram pulls neighbors together in 2D.")}
        ${card("#/attention", "3.3", "Attention", "Query–key heatmap before transformers.")}
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
      <p class="chapter-lede">Linked study notes and slides — open a PDF, or jump into the matching lab when one exists.</p>
    </section>
  `;
  return () => {
    root.innerHTML = "";
  };
}

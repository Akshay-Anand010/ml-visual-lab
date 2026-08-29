export function renderHome(root) {
  root.innerHTML = `
    <section class="hero">
      <div class="kicker">Interactive observatory</div>
      <h1>Watch machine learning happen, not just the equations.</h1>
      <p class="lede">
        Each lab is a small working model: activations travel forward, errors travel back,
        kernels slide, hidden states remember, and words pull their neighbors closer.
        Drag sliders, step through time, and keep the picture next to the math.
      </p>
    </section>
    <section class="grid">
      ${card("#/neural", "01", "Neural network", "A layered graph of neurons. Push the inputs and watch activation flow to the output.")}
      ${card("#/backprop", "02", "Backpropagation", "After a guess, error walks backward and every weight takes a tiny step downhill.")}
      ${card("#/cnn", "03", "Convolutional net", "A 3×3 kernel slides across pixels. Edges light up; pooling shrinks the map.")}
      ${card("#/rnn", "04", "Recurrent net", "The same cell reads a sequence. Hidden state is the memory that loops back.")}
      ${card("#/tfidf", "05", "TF-IDF", "Rare words in a document get more weight. Edit the corpus and the heatmap updates.")}
      ${card("#/word2vec", "06", "Word2Vec", "Skip-gram training: the center word pulls context closer and pushes random words away.")}
      ${card("#/attention", "07", "Attention", "Queries look at keys. Bright cells are who a token listens to before mixing values.")}
    </section>
  `;
  return () => {
    root.innerHTML = "";
  };
}

function card(href, n, title, body) {
  return `<a class="card" href="${href}">
    <div class="tag">${n}</div>
    <h2>${title}</h2>
    <p>${body}</p>
  </a>`;
}

import { labShell, themeColors } from "../ui.js";

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function compute(docs) {
  const tokens = docs.map(tokenize);
  const df = {};
  const vocabSet = new Set();
  tokens.forEach((toks) => {
    new Set(toks).forEach((t) => {
      df[t] = (df[t] || 0) + 1;
      vocabSet.add(t);
    });
  });
  const vocab = [...vocabSet].sort();
  const N = docs.length;
  const idf = Object.fromEntries(vocab.map((t) => [t, Math.log((N + 1) / (df[t] + 1)) + 1]));
  const tfidf = tokens.map((toks) => {
    const tf = {};
    toks.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });
    const len = toks.length || 1;
    return Object.fromEntries(vocab.map((t) => [t, ((tf[t] || 0) / len) * idf[t]]));
  });
  return { vocab, tokens, idf, tfidf };
}

function heat(v, max, light) {
  const t = max ? v / max : 0;
  if (light) {
    const r = Math.round(255 - t * 40);
    const g = Math.round(248 - t * 90);
    const b = Math.round(230 - t * 160);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(20 + t * 210);
  const g = Math.round(40 + t * 160);
  const b = Math.round(50 + (1 - t) * 40);
  return `rgb(${r},${g},${b})`;
}

export function mountTfidf(root) {
  const { extra } = labShell(root, {
    title: "TF-IDF",
    kicker: "What makes a word distinctive",
    body: "Term frequency says how often a word appears in one document. Inverse document frequency down-weights words that appear everywhere (“the”, “and”). Their product highlights the words that characterize a document.",
    formula: "tf(t,d) = count(t,d) / |d|\nidf(t) = log((N+1)/(df(t)+1)) + 1\ntfidf = tf · idf",
    guideKey: "tfidf",
    notesHref: "#/notes?doc=Bag%20of%20Words%2FRepresentation_of_Words_Clear_Notes.pdf",
    controlsHtml: `
      <label class="ctrl">Document A
        <textarea id="d0">Neural networks learn weights from data using gradient descent.</textarea>
      </label>
      <label class="ctrl">Document B
        <textarea id="d1">Gradient descent walks downhill on a loss surface to train models.</textarea>
      </label>
      <label class="ctrl">Document C
        <textarea id="d2">Cats sit on mats. The cat sat near another cat.</textarea>
      </label>
      <div class="btn-row"><button id="go">Recompute</button></div>
    `,
  });

  extra.innerHTML = `<div class="table-wrap" id="tbl"></div><p class="explain" id="hint" style="padding:0.6rem 0 0"></p>`;
  const canvas = root.querySelector("#viz");
  canvas.style.display = "none";

  function render() {
    const docs = [0, 1, 2].map((i) => root.querySelector(`#d${i}`).value);
    const { vocab, idf, tfidf } = compute(docs);
    const max = Math.max(...tfidf.flatMap((row) => vocab.map((t) => row[t])), 1e-6);
    extra.querySelector("#tbl").innerHTML = `
      <table>
        <thead>
          <tr><th>term</th><th>idf</th><th>A</th><th>B</th><th>C</th></tr>
        </thead>
        <tbody>
          ${vocab
            .map((t) => {
              const cells = tfidf
                .map((row) => {
                  const v = row[t];
                  return `<td class="heat" style="background:${heat(v, max, themeColors().light)}">${v.toFixed(2)}</td>`;
                })
                .join("");
              return `<tr><td>${t}</td><td>${idf[t].toFixed(2)}</td>${cells}</tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;
    extra.querySelector("#hint").textContent =
      "Bright cells are important for that document. “cat” lights up only in C; “gradient” lights up in A and B.";
  }

  root.querySelector("#go").onclick = render;
  [0, 1, 2].forEach((i) => {
    root.querySelector(`#d${i}`).addEventListener("input", render);
  });
  render();
  return () => {};
}

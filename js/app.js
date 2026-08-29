import { renderHome } from "./home.js";
import { renderNotes } from "./notes.js";
import { renderEvolution } from "./evolution.js";
import { renderPath } from "./path.js";
import { mountNeural } from "./labs/neural.js";
import { mountBackprop } from "./labs/backprop.js";
import { mountCnn } from "./labs/cnn.js";
import { mountRnn } from "./labs/rnn.js";
import { mountTfidf } from "./labs/tfidf.js";
import { mountWord2Vec } from "./labs/word2vec.js";
import { mountAttention } from "./labs/attention.js";
import { mountLinreg } from "./labs/linreg.js";
import { mountLogreg } from "./labs/logreg.js";
import { mountPca } from "./labs/pca.js";
import { mountDecisionTree } from "./labs/decision-tree.js";
import { mountKnn } from "./labs/knn.js";
import { mountLandscape } from "./labs/landscape.js";
import { mountSoftmax } from "./labs/softmax.js";

const app = document.getElementById("app");
let cleanup = () => {};

const routes = {
  "": renderHome,
  notes: renderNotes,
  evolution: renderEvolution,
  path: renderPath,
  linreg: mountLinreg,
  logreg: mountLogreg,
  pca: mountPca,
  tree: mountDecisionTree,
  knn: mountKnn,
  landscape: mountLandscape,
  softmax: mountSoftmax,
  neural: mountNeural,
  backprop: mountBackprop,
  cnn: mountCnn,
  rnn: mountRnn,
  tfidf: mountTfidf,
  word2vec: mountWord2Vec,
  attention: mountAttention,
};

function currentKey() {
  return (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
}

function route() {
  cleanup();
  const key = currentKey();
  document.querySelectorAll(".top-nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === `#/${key}` || (key === "" && href === "#/"));
  });
  const mount = routes[key] || renderHome;
  cleanup = mount(app) || (() => {});
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();

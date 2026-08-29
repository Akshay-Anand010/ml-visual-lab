import { renderHome } from "./home.js";
import { mountNeural } from "./labs/neural.js";
import { mountBackprop } from "./labs/backprop.js";
import { mountCnn } from "./labs/cnn.js";
import { mountRnn } from "./labs/rnn.js";
import { mountTfidf } from "./labs/tfidf.js";
import { mountWord2Vec } from "./labs/word2vec.js";
import { mountAttention } from "./labs/attention.js";

const app = document.getElementById("app");
let cleanup = () => {};

const routes = {
  "": renderHome,
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
    a.classList.toggle("active", a.getAttribute("href") === `#/${key}`);
  });
  const mount = routes[key] || renderHome;
  cleanup = mount(app) || (() => {});
}

window.addEventListener("hashchange", route);
route();

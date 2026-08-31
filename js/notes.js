import { NOTES_REPO, githubBlobUrl, notesViewerHash, docFromHash } from "./pdf-remote.js";
import { createPdfViewer } from "./pdf-viewer.js";

const NOTES = [
  {
    chapter: "Foundations & classical ML",
    items: [
      { title: "Linear / classifier notes", path: "Linear Regression/linear_classifier_study_notes.pdf", lab: "#/linreg", tags: ["regression", "gradient"] },
      { title: "Logistic regression", path: "Logistic Regression/logistic_regression_study_notes.pdf", lab: "#/logreg", tags: ["classification", "gradient"] },
      { title: "Decision trees", path: "Decision Tree/Beautified_Decision_Tree_Algorithm.pdf", lab: "#/tree", tags: ["tree", "overfitting"] },
      { title: "PCA", path: "PCA/beautified_pca_notes.pdf", lab: "#/pca", tags: ["features"] },
      { title: "PCA (extended)", path: "PCA/pca27.pdf", lab: "#/pca", tags: ["features"] },
      { title: "SVM & ensembles", path: "Ensemble techiques/AIML27SVMandEnsemble_beautified.pdf", lab: null, tags: ["svm", "ensemble"] },
      { title: "Generalization", path: "Generalization/ML_Morning_Session_Notes.pdf", lab: "#/tree", tags: ["overfitting"] },
      { title: "Data preprocessing", path: "Data preprocessing/Beautiful_Data_Preprocessing_Notes.pdf", lab: null, tags: ["features"] },
      { title: "Word representations / BoW", path: "Bag of Words/Representation_of_Words_Clear_Notes.pdf", lab: "#/tfidf", tags: ["nlp"] },
    ],
  },
  {
    chapter: "Additional reading",
    items: [
      { title: "Linear regression", path: "reading-materials/U1/2026-05-16_Intro-to-ML-Algorithms-Key-Python-Tools/lecture-notes/Linear-Regression__Linear_regression_V1.8.pdf", lab: "#/linreg", tags: ["regression"] },
      { title: "k-NN", path: "reading-materials/U1/2026-05-16_Intro-to-ML-Algorithms-Key-Python-Tools/lecture-notes/KNN__kNN_V1.8.pdf", lab: "#/knn", tags: ["classification"] },
      { title: "Logistic regression slides", path: "reading-materials/U1/2026-05-23_Important-Python-Tools-Packages/lecture-notes/Logistic-Regression__Logistic_Regression_.pdf", lab: "#/logreg", tags: ["classification"] },
      { title: "Decision trees & overfitting", path: "reading-materials/U1/2026-06-06_Decision-Trees-Overfitting-Hackathon-I/lecture-notes/Decision-Trees-Overfitting__Decision_Trees_Overfitting.pdf", lab: "#/tree", tags: ["tree", "overfitting"] },
      { title: "Support vector machines", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Support-Vector-Machines__Support_Vector_Machines.pdf", lab: null, tags: ["svm"] },
      { title: "Ensemble methods", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Ensemble-Methods__Ensemble_Methods.pdf", lab: null, tags: ["ensemble"] },
      { title: "Representing text & language", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Representing-Text-and-Language__Representing_Text_and_Language_V1.8.pdf", lab: "#/tfidf", tags: ["nlp"] },
    ],
  },
  {
    chapter: "Neural nets, CNN & sequences",
    items: [
      { title: "Convolution layer", path: "reading-materials/U3/2026-07-25_CNN-Back-Propagation/lecture-notes/Convolution-Layer__ConvolutionLayer.pdf", lab: "#/cnn", tags: ["cnn"] },
      { title: "Backpropagation", path: "reading-materials/U3/2026-07-25_CNN-Back-Propagation/lecture-notes/Back-Propagation__Back-Propagation.pdf", lab: "#/backprop", tags: ["gradient"] },
      { title: "CNN architecture", path: "reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/L1_CNN_Architecture-Final_V1.8.pdf", lab: "#/cnn", tags: ["cnn"] },
      { title: "CNNs in practice", path: "reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/L2_CNN4All-Final_V1.8.pdf", lab: "#/cnn", tags: ["cnn"] },
      { title: "RNN intro", path: "reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/L3_RNN_Intro_V1.8.pdf", lab: "#/rnn", tags: ["rnn"] },
      { title: "Association rules", path: "reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/Association_Rules_V1.8.pdf", lab: null, tags: ["recommender"] },
      { title: "Recommender systems", path: "reading-materials/U3/2026-08-08_Recommender-Systems-Time-Series/Lecture-Notes/Recommendation_Systems_V1.8.pdf", lab: null, tags: ["recommender"] },
      { title: "Beyond AlexNet", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Lecture-Notes/L1-Beyond-AlexNet_V1.8__1_.pdf", lab: "#/cnn", tags: ["cnn"] },
      { title: "Beyond backpropagation", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Lecture-Notes/L2-Beyond-BackProp_V1.9.pdf", lab: "#/backprop", tags: ["gradient"] },
      { title: "RNNs (part II)", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Lecture-Notes/L3_RNN-II_V1.9.pdf", lab: "#/rnn", tags: ["rnn"] },
      { title: "ML in speech systems", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Lecture-Notes/AI_ML_in_speech_systems_V1.9.pdf", lab: "#/rnn", tags: ["speech", "rnn"] },
      { title: "Speech production (pre-read)", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Pre-reading-Materials/Speech__Production.pdf", lab: "#/rnn", tags: ["speech"] },
      { title: "MFCC (reference)", path: "reading-materials/U3/2026-08-22_CNN-Insight-RNN-LSTM-Speech/Reference-Materials/MFCC_LEC_ABS_Ref.pdf", lab: "#/rnn", tags: ["speech"] },
    ],
  },
];

const ALL_TAGS = ["regression", "classification", "gradient", "tree", "overfitting", "features", "svm", "ensemble", "nlp", "cnn", "rnn", "recommender", "speech"];

function findNote(path) {
  for (const sec of NOTES) {
    const hit = sec.items.find((n) => n.path === path);
    if (hit) return hit;
  }
  return path ? { title: path.split("/").pop(), path, lab: null, tags: [] } : null;
}

export function renderNotes(root) {
  let filter = "all";
  let activePath = docFromHash();
  let viewer = null;

  const paint = () => {
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }

    const active = findNote(activePath);
    root.innerHTML = `
      <section class="hero narrow">
        <div class="kicker">Reference library</div>
        <h1>Notes &amp; reading</h1>
        <p class="lede">
          PDFs stay in
          <a class="ext" href="${NOTES_REPO}" target="_blank" rel="noreferrer">the notes repo</a>
          and are streamed here for reading — not copied into this site.
        </p>
        <div class="tag-row">
          <button type="button" class="chip-btn ${filter === "all" ? "on" : ""}" data-tag="all">all</button>
          ${ALL_TAGS.map(
            (t) => `<button type="button" class="chip-btn ${filter === t ? "on" : ""}" data-tag="${t}">#${t}</button>`
          ).join("")}
        </div>
      </section>

      <section class="notes-layout chapter-block">
        <div class="notes-sidebar">
          ${NOTES.map((sec) => {
            const items = sec.items.filter((n) => filter === "all" || n.tags.includes(filter));
            if (!items.length) return "";
            return `
              <h2 class="chapter-title">${sec.chapter}</h2>
              <div class="notes-list">
                ${items
                  .map(
                    (n) => `
                  <button type="button" class="note-row note-pick ${activePath === n.path ? "active" : ""}" data-path="${n.path.replace(/"/g, "&quot;")}">
                    <div>
                      <strong>${n.title}</strong>
                      <div class="tag-row tight">${n.tags.map((t) => `<span class="chip">#${t}</span>`).join("")}</div>
                    </div>
                  </button>`
                  )
                  .join("")}
              </div>`;
          }).join("")}
        </div>
        <div class="notes-reader panel">
          <div class="notes-reader-head">
            <div>
              <div class="kicker">In-page reader</div>
              <h2 class="chapter-title" id="reader-title">${active ? active.title : "Pick a note"}</h2>
              ${active ? `<div class="note-path">${active.path}</div>` : ""}
            </div>
            <div class="note-actions">
              ${
                active
                  ? `<a class="btn-link ghost" href="${githubBlobUrl(active.path)}" target="_blank" rel="noreferrer">Open on GitHub</a>`
                  : ""
              }
              ${active?.lab ? `<a class="btn-link" href="${active.lab}">Open lab</a>` : ""}
            </div>
          </div>
          <div id="pdf-host"></div>
        </div>
      </section>
    `;

    root.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.tag;
        paint();
      });
    });

    root.querySelectorAll(".note-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePath = btn.dataset.path;
        const next = notesViewerHash(activePath);
        if (location.hash !== next) location.hash = next;
        else paint();
      });
    });

    viewer = createPdfViewer(root.querySelector("#pdf-host"));
    if (activePath) viewer.setSource(activePath);
  };

  paint();

  return () => {
    if (viewer) viewer.destroy();
    root.innerHTML = "";
  };
}

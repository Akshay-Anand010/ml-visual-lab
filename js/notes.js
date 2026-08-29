const NOTES_REPO = "https://github.com/Akshay-Anand010/AIML-IIITH-2026";
const blob = (path) => `${NOTES_REPO}/blob/main/${path.split("/").map(encodeURIComponent).join("/")}`;

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
];

const ALL_TAGS = ["regression", "classification", "gradient", "tree", "overfitting", "features", "svm", "ensemble", "nlp"];

export function renderNotes(root) {
  let filter = "all";

  const paint = () => {
    root.innerHTML = `
      <section class="hero narrow">
        <div class="kicker">Reference library</div>
        <h1>Notes &amp; reading</h1>
        <p class="lede">
          Study PDFs on
          <a class="ext" href="${NOTES_REPO}" target="_blank" rel="noreferrer">GitHub</a>.
          Filter by concept tag, open a PDF, or jump to a lab.
        </p>
        <div class="tag-row">
          <button type="button" class="chip-btn ${filter === "all" ? "on" : ""}" data-tag="all">all</button>
          ${ALL_TAGS.map(
            (t) => `<button type="button" class="chip-btn ${filter === t ? "on" : ""}" data-tag="${t}">#${t}</button>`
          ).join("")}
        </div>
      </section>
      ${NOTES.map((sec) => {
        const items = sec.items.filter((n) => filter === "all" || n.tags.includes(filter));
        if (!items.length) return "";
        return `
        <section class="chapter-block">
          <h2 class="chapter-title">${sec.chapter}</h2>
          <div class="notes-list">
            ${items
              .map(
                (n) => `
              <div class="note-row">
                <div>
                  <strong>${n.title}</strong>
                  <div class="note-path">${n.path}</div>
                  <div class="tag-row tight">${n.tags.map((t) => `<span class="chip">#${t}</span>`).join("")}</div>
                </div>
                <div class="note-actions">
                  <a class="btn-link" href="${blob(n.path)}" target="_blank" rel="noreferrer">Open PDF</a>
                  ${n.lab ? `<a class="btn-link ghost" href="${n.lab}">Open lab</a>` : ""}
                </div>
              </div>`
              )
              .join("")}
          </div>
        </section>`;
      }).join("")}
    `;
    root.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.tag;
        paint();
      });
    });
  };
  paint();
  return () => {
    root.innerHTML = "";
  };
}

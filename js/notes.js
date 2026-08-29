const COURSE = "https://github.com/Akshay-Anand010/AIML-IIITH-2026";
const blob = (path) => `${COURSE}/blob/main/${path.split("/").map(encodeURIComponent).join("/")}`;

const NOTES = [
  {
    chapter: "Foundations & classical ML",
    items: [
      { title: "Linear / classifier notes", path: "Linear Regression/linear_classifier_study_notes.pdf", lab: "#/linreg" },
      { title: "Logistic regression", path: "Logistic Regression/logistic_regression_study_notes.pdf", lab: "#/logreg" },
      { title: "Decision trees", path: "Decision Tree/Beautified_Decision_Tree_Algorithm.pdf", lab: "#/tree" },
      { title: "PCA", path: "PCA/beautified_pca_notes.pdf", lab: "#/pca" },
      { title: "PCA (lecture)", path: "PCA/pca27.pdf", lab: "#/pca" },
      { title: "SVM & ensembles", path: "Ensemble techiques/AIML27SVMandEnsemble_beautified.pdf", lab: null },
      { title: "Generalization (morning)", path: "Generalization/ML_Morning_Session_Notes.pdf", lab: null },
      { title: "Data preprocessing", path: "Data preprocessing/Beautiful_Data_Preprocessing_Notes.pdf", lab: null },
      { title: "Word representations / BoW", path: "Bag of Words/Representation_of_Words_Clear_Notes.pdf", lab: "#/tfidf" },
    ],
  },
  {
    chapter: "Lecture packs (selected)",
    items: [
      { title: "Linear regression (V1.8)", path: "reading-materials/U1/2026-05-16_Intro-to-ML-Algorithms-Key-Python-Tools/lecture-notes/Linear-Regression__Linear_regression_V1.8.pdf", lab: "#/linreg" },
      { title: "k-NN", path: "reading-materials/U1/2026-05-16_Intro-to-ML-Algorithms-Key-Python-Tools/lecture-notes/KNN__kNN_V1.8.pdf", lab: null },
      { title: "Logistic regression slides", path: "reading-materials/U1/2026-05-23_Important-Python-Tools-Packages/lecture-notes/Logistic-Regression__Logistic_Regression_.pdf", lab: "#/logreg" },
      { title: "Decision trees + overfitting", path: "reading-materials/U1/2026-06-06_Decision-Trees-Overfitting-Hackathon-I/lecture-notes/Decision-Trees-Overfitting__Decision_Trees_Overfitting.pdf", lab: "#/tree" },
      { title: "Support vector machines", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Support-Vector-Machines__Support_Vector_Machines.pdf", lab: null },
      { title: "Ensemble methods", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Ensemble-Methods__Ensemble_Methods.pdf", lab: null },
      { title: "Representing text & language", path: "reading-materials/U1/2026-05-30_Intro-to-ML-Algorithms-Concepts-2/lecture-notes/Representing-Text-and-Language__Representing_Text_and_Language_V1.8.pdf", lab: "#/tfidf" },
    ],
  },
];

export function renderNotes(root) {
  root.innerHTML = `
    <section class="hero narrow">
      <div class="kicker">From your course repo</div>
      <h1>PDF notes & lecture packs</h1>
      <p class="lede">
        Linked from
        <a class="ext" href="${COURSE}" target="_blank" rel="noreferrer">Akshay-Anand010/AIML-IIITH-2026</a>
        — open a PDF on GitHub, or jump into the matching interactive lab when one exists.
      </p>
    </section>
    ${NOTES.map(
      (sec) => `
      <section class="chapter-block">
        <h2 class="chapter-title">${sec.chapter}</h2>
        <div class="notes-list">
          ${sec.items
            .map(
              (n) => `
            <div class="note-row">
              <div>
                <strong>${n.title}</strong>
                <div class="note-path">${n.path}</div>
              </div>
              <div class="note-actions">
                <a class="btn-link" href="${blob(n.path)}" target="_blank" rel="noreferrer">Open PDF</a>
                ${n.lab ? `<a class="btn-link ghost" href="${n.lab}">Open lab</a>` : ""}
              </div>
            </div>`
            )
            .join("")}
        </div>
      </section>`
    ).join("")}
    <p class="site-foot-inline">More notebooks live under <code>colab-notebooks/</code> in the same repo (CNN, backprop, Keras, time series…).</p>
  `;
  return () => {
    root.innerHTML = "";
  };
}

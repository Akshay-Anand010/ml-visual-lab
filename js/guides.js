/** Curated plain-language explainers + best external reads (labs only, not Notes). */
export const LAB_GUIDES = {
  landscape: {
    simple:
      "Training is like rolling a ball downhill. The height is “how wrong” the model is. Learning rate is step size: tiny steps crawl; huge steps bounce past the valley.",
    bullets: [
      "Loss = how bad the current guess is",
      "Gradient = steepest uphill direction",
      "We step opposite the gradient to go downhill",
    ],
    links: [
      { label: "3Blue1Brown — Gradient descent", href: "https://www.youtube.com/watch?v=IHZwWFHWa-w" },
      { label: "Distill — Why momentum works", href: "https://distill.pub/2017/momentum/" },
    ],
  },
  linreg: {
    simple:
      "Draw the best straight line through noisy dots. We nudge slope and intercept until the line’s total squared miss is small.",
    bullets: [
      "Prediction: ŷ = wx + b",
      "Error: how far ŷ is from the true y",
      "Each epoch gently updates w and b",
    ],
    links: [
      { label: "StatQuest — Linear regression", href: "https://www.youtube.com/watch?v=nk2CQITm_eo" },
      { label: "Google ML Crash Course — Linear regression", href: "https://developers.google.com/machine-learning/crash-course/linear-regression" },
    ],
  },
  logreg: {
    simple:
      "Same idea as a line, but the answer is a probability between 0 and 1 (yes/no). Soft S-curve instead of a hard cut.",
    bullets: [
      "Output is a probability, not any number",
      "Decision boundary is still basically a line in 2D",
      "Great baseline before fancy models",
    ],
    links: [
      { label: "StatQuest — Logistic regression", href: "https://www.youtube.com/watch?v=yIYKR4sgzI8" },
      { label: "Google ML Crash Course — Logistic regression", href: "https://developers.google.com/machine-learning/crash-course/logistic-regression" },
    ],
  },
  knn: {
    simple:
      "No training weights. To label a new point, look at its k nearest neighbors and take a majority vote.",
    bullets: [
      "Small k → jagged, local decisions",
      "Large k → smoother, more global",
      "Needs a distance (usually Euclidean)",
    ],
    links: [
      { label: "StatQuest — KNN", href: "https://www.youtube.com/watch?v=HVXime0nQeI" },
      { label: "Google ML Crash Course — Classification", href: "https://developers.google.com/machine-learning/crash-course/classification" },
    ],
  },
  tree: {
    simple:
      "Ask yes/no questions on one feature at a time (axis splits). Leaves give a class. Too many questions → memorizes noise (overfitting).",
    bullets: [
      "Each split cuts the plane with a straight line",
      "Depth controls complexity",
      "Deep trees can look perfect on training data and fail on new data",
    ],
    links: [
      { label: "StatQuest — Decision trees", href: "https://www.youtube.com/watch?v=7VeUPuFGJHk" },
      { label: "Google — Intro to decision trees", href: "https://developers.google.com/machine-learning/decision-forests/intro-to-trees" },
    ],
  },
  pca: {
    simple:
      "Find the directions where the cloud of points spreads the most. Keep those axes to compress data with less information loss.",
    bullets: [
      "PC1 = direction of max variance",
      "PC2 is perpendicular to PC1",
      "Used for visualization and denoising",
    ],
    links: [
      { label: "StatQuest — PCA clearly explained", href: "https://www.youtube.com/watch?v=FgakZw6K1QQ" },
      { label: "Setosa.io — PCA explainer", href: "https://setosa.io/ev/principal-component-analysis/" },
    ],
  },
  softmax: {
    simple:
      "Turn raw scores (logits) into percentages that add to 100%. The biggest score gets the biggest share.",
    bullets: [
      "Always a valid probability distribution",
      "Temperature: low = peaky, high = flat",
      "Usual last layer for multi-class nets",
    ],
    links: [
      { label: "CS231n — Softmax classifier", href: "https://cs231n.github.io/linear-classify/#softmax-classifier" },
      { label: "StatQuest — Softmax", href: "https://www.youtube.com/watch?v=KpKog-L9veg" },
    ],
  },
  neural: {
    simple:
      "Stack layers of tiny calculators. Each mixes inputs with weights, then applies a bend (activation). Together they draw wiggly decision surfaces.",
    bullets: [
      "Weights = knobs the model learns",
      "Activation adds non-linearity",
      "Dead ReLUs stuck at 0 stop learning",
    ],
    links: [
      { label: "3Blue1Brown — Neural networks", href: "https://www.youtube.com/watch?v=aircAruvnKk" },
      { label: "TensorFlow Playground", href: "https://playground.tensorflow.org/" },
    ],
  },
  backprop: {
    simple:
      "After a guess, measure the miss, then walk that miss backward through every weight so each knob knows how to improve a tiny bit.",
    bullets: [
      "Forward pass = make a prediction",
      "Backward pass = assign blame to weights",
      "Learning rate controls update size",
    ],
    links: [
      { label: "3Blue1Brown — Backpropagation", href: "https://www.youtube.com/watch?v=Ilg3gGewQ5U" },
      { label: "CS231n — Backprop notes", href: "https://cs231n.github.io/optimization-2/" },
    ],
  },
  cnn: {
    simple:
      "A tiny filter slides across an image, spotting local patterns (edges, textures). Stack filters → parts → objects.",
    bullets: [
      "Convolution = shared local detector",
      "ReLU drops negative responses",
      "Pooling shrinks the map",
    ],
    links: [
      { label: "CNN Explainer (interactive)", href: "https://poloclub.github.io/cnn-explainer/" },
      { label: "3Blue1Brown — Convolutions", href: "https://www.youtube.com/watch?v=KuXjwB4LzSA" },
    ],
  },
  rnn: {
    simple:
      "One cell reads the sequence step by step and keeps a hidden memory vector. Order matters: “dog bites man” ≠ “man bites dog”.",
    bullets: [
      "Same weights reused at every time step",
      "Hidden state carries context forward",
      "Long sequences can “forget” (vanishing gradients)",
    ],
    links: [
      { label: "Illustrated Guide to RNNs", href: "https://towardsdatascience.com/illustrated-guide-to-recurrent-neural-networks-79e5eb80405b" },
      { label: "Christopher Olah — Understanding LSTMs", href: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/" },
    ],
  },
  tfidf: {
    simple:
      "Words that appear a lot in one document but rarely across documents get a high score. “the” is common everywhere → low weight.",
    bullets: [
      "TF = how often in this doc",
      "IDF = how rare across docs",
      "TF-IDF = TF × IDF",
    ],
    links: [
      { label: "TF-IDF clearly explained (video)", href: "https://www.youtube.com/watch?v=6vNyQRdFyuE" },
      { label: "scikit-learn — TfidfVectorizer", href: "https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html" },
    ],
  },
  word2vec: {
    simple:
      "Words that show up in similar neighborhoods get similar vectors. “king” ends up near “queen” in meaning-space.",
    bullets: [
      "Skip-gram: center word predicts neighbors",
      "Training pulls true neighbors closer",
      "Embeddings are reusable features",
    ],
    links: [
      { label: "Illustrated Word2Vec (Jay Alammar)", href: "https://jalammar.github.io/illustrated-word2vec/" },
      { label: "TensorFlow — Word2Vec tutorial", href: "https://www.tensorflow.org/text/tutorials/word2vec" },
    ],
  },
  attention: {
    simple:
      "Each word asks “who should I listen to?” Bright cells mean strong attention. That mix builds a context-aware representation.",
    bullets: [
      "Query = what I’m looking for",
      "Key = what each token offers",
      "Value = what gets mixed into the answer",
    ],
    links: [
      { label: "Illustrated Transformer (Jay Alammar)", href: "https://jalammar.github.io/illustrated-transformer/" },
      { label: "3Blue1Brown — Attention", href: "https://www.youtube.com/watch?v=eMlx5fFNoYc" },
    ],
  },
};

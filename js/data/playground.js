/** Seeded RNG so every lab sees the same playground points. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shared 2D binary classification set used across logistic / tree / k-NN / softmax demos.
 * Two slightly overlapping blobs — linearly imperfect so trees and neighbors can win.
 */
export function playgroundClassify(seed = 42, n = 80, noise = 0.45) {
  const rand = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const label = i < n / 2 ? 0 : 1;
    const cx = label ? 0.42 : -0.42;
    const cy = label ? 0.28 : -0.28;
    pts.push({
      x: cx + (rand() - 0.5) * noise * 2.2,
      y: cy + (rand() - 0.5) * noise * 2.0,
      label,
    });
  }
  return pts;
}

export function playgroundRegression(seed = 7, n = 30, noise = 0.35) {
  const rand = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = -1 + (2 * i) / (n - 1);
    const y = 0.55 * x + 0.1 + (rand() - 0.5) * noise;
    pts.push({ x, y });
  }
  return pts;
}

const PROGRESS_KEY = "mlvl-progress-v1";

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markDone(id) {
  const p = loadProgress();
  p[id] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  return p;
}

export function isDone(id) {
  return !!loadProgress()[id];
}

/** Guided path: shared dataset story then deep learning. */
export const LEARNING_PATH = [
  {
    id: "path-landscape",
    href: "#/landscape",
    title: "Loss landscape",
    why: "See why gradient descent walks downhill before fitting anything.",
    check: "Drag η and watch a ball roll into a valley.",
  },
  {
    id: "path-linreg",
    href: "#/linreg",
    title: "Linear regression",
    why: "Fit a line by shrinking squared error — the simplest learner.",
    check: "Train until the line looks right; note how noise moves the fit.",
  },
  {
    id: "path-logreg",
    href: "#/logreg",
    title: "Logistic regression",
    why: "Same playground points; a linear boundary is honest but limited.",
    check: "Train and read accuracy — some points stay on the wrong side.",
  },
  {
    id: "path-knn",
    href: "#/knn",
    title: "k-Nearest neighbors",
    why: "Same points, no training — vote among neighbors.",
    check: "Change k and see the boundary go from jagged to smooth.",
  },
  {
    id: "path-tree",
    href: "#/tree",
    title: "Decision tree",
    why: "Same points again; axis splits carve regions trees can memorize.",
    check: "Raise depth until train accuracy is high — that is overfitting risk.",
  },
  {
    id: "path-softmax",
    href: "#/softmax",
    title: "Softmax",
    why: "Turn scores into a probability distribution over classes.",
    check: "Nudge logits and watch probabilities sum to 1.",
  },
  {
    id: "path-neural",
    href: "#/neural",
    title: "Neural network",
    why: "Stack non-linear layers; try the dead-ReLU failure mode.",
    check: "Toggle “kill with ReLU” and shuffle until some neurons stay dark.",
  },
  {
    id: "path-backprop",
    href: "#/backprop",
    title: "Backpropagation",
    why: "Step one example at a time; scrub the loss history.",
    check: "Use Step / scrub until XOR accuracy climbs.",
  },
];

export function pathStats() {
  const p = loadProgress();
  const done = LEARNING_PATH.filter((s) => p[s.id]).length;
  return { done, total: LEARNING_PATH.length };
}

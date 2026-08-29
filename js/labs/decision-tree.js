import { labShell, setupCanvas } from "../ui.js";

function makeData() {
  const pts = [];
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const label = x * 0.7 + y * 0.5 > 0.05 ? 1 : 0;
    // sprinkle noise near boundary
    pts.push({
      x: x + (Math.random() - 0.5) * 0.15,
      y: y + (Math.random() - 0.5) * 0.15,
      label: Math.random() < 0.08 ? 1 - label : label,
    });
  }
  return pts;
}

function gini(labels) {
  if (!labels.length) return 0;
  const p = labels.filter((l) => l === 1).length / labels.length;
  return 1 - p * p - (1 - p) * (1 - p);
}

function bestSplit(pts) {
  let best = null;
  ["x", "y"].forEach((axis) => {
    const vals = [...new Set(pts.map((p) => p[axis]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const thr = (vals[i] + vals[i + 1]) / 2;
      const left = pts.filter((p) => p[axis] <= thr);
      const right = pts.filter((p) => p[axis] > thr);
      if (!left.length || !right.length) continue;
      const impurity =
        (left.length * gini(left.map((p) => p.label)) + right.length * gini(right.map((p) => p.label))) /
        pts.length;
      if (!best || impurity < best.impurity) best = { axis, thr, impurity, left, right };
    }
  });
  return best;
}

function buildTree(pts, depth, maxDepth) {
  const labels = pts.map((p) => p.label);
  const maj = labels.filter((l) => l === 1).length >= labels.length / 2 ? 1 : 0;
  if (depth >= maxDepth || gini(labels) < 0.02 || pts.length < 3) {
    return { leaf: true, label: maj, n: pts.length };
  }
  const sp = bestSplit(pts);
  if (!sp) return { leaf: true, label: maj, n: pts.length };
  return {
    leaf: false,
    axis: sp.axis,
    thr: sp.thr,
    left: buildTree(sp.left, depth + 1, maxDepth),
    right: buildTree(sp.right, depth + 1, maxDepth),
    n: pts.length,
  };
}

function predict(node, p) {
  if (node.leaf) return node.label;
  return p[node.axis] <= node.thr ? predict(node.left, p) : predict(node.right, p);
}

function listSplits(node, bounds, out = []) {
  if (!node || node.leaf) return out;
  out.push({ axis: node.axis, thr: node.thr, bounds: { ...bounds } });
  if (node.axis === "x") {
    listSplits(node.left, { ...bounds, x1: node.thr }, out);
    listSplits(node.right, { ...bounds, x0: node.thr }, out);
  } else {
    listSplits(node.left, { ...bounds, y1: node.thr }, out);
    listSplits(node.right, { ...bounds, y0: node.thr }, out);
  }
  return out;
}

export function mountDecisionTree(root) {
  const { canvas } = labShell(root, {
    title: "Decision tree",
    kicker: "Chapter 1 · Classical ML",
    body: "Axis-aligned splits carve the plane into rectangles. Deeper trees fit training noise (overfitting). Compare shallow vs deep — the same trade-off you saw in generalization notes.",
    formula: "split = argmin Gini(left) + Gini(right)\nleaf → majority class",
    controlsHtml: `
      <label class="ctrl">Max depth <span id="dv" class="stat">2</span>
        <input id="depth" type="range" min="1" max="6" step="1" value="2" />
      </label>
      <div class="btn-row">
        <button id="rebuild">Rebuild tree</button>
        <button class="ghost" id="newdata">New data</button>
      </div>
      <p class="explain" id="status"></p>
      <p class="explain"><a class="ext" href="https://github.com/Akshay-Anand010/AIML-IIITH-2026/blob/main/Decision%20Tree/Beautified_Decision_Tree_Algorithm.pdf" target="_blank" rel="noreferrer">Course notes →</a></p>
    `,
  });

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let pts = makeData();
  let tree = buildTree(pts, 0, 2);

  function rebuild() {
    const d = Number(root.querySelector("#depth").value);
    tree = buildTree(pts, 0, d);
    const acc = pts.filter((p) => predict(tree, p) === p.label).length / pts.length;
    root.querySelector("#status").innerHTML =
      `depth ${d} · train accuracy <span class="stat">${(acc * 100).toFixed(0)}%</span> · deeper ≠ always better on new data`;
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    ctx.clearRect(0, 0, W, H);
    const pad = 36;
    const toX = (x) => pad + ((x + 1.2) / 2.4) * (W - pad * 2);
    const toY = (y) => H - pad - ((y + 1.2) / 2.4) * (H - pad * 2);

    const splits = listSplits(tree, { x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2 });
    // paint regions coarsely
    const step = 10;
    for (let yy = pad; yy < H - pad; yy += step) {
      for (let xx = pad; xx < W - pad; xx += step) {
        const x = ((xx - pad) / (W - pad * 2)) * 2.4 - 1.2;
        const y = ((H - pad - yy) / (H - pad * 2)) * 2.4 - 1.2;
        const lab = predict(tree, { x, y });
        ctx.fillStyle = lab ? "rgba(110,224,196,0.14)" : "rgba(239,123,108,0.14)";
        ctx.fillRect(xx, yy, step, step);
      }
    }

    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 1.5;
    splits.forEach((s) => {
      ctx.beginPath();
      if (s.axis === "x") {
        ctx.moveTo(toX(s.thr), toY(s.bounds.y0));
        ctx.lineTo(toX(s.thr), toY(s.bounds.y1));
      } else {
        ctx.moveTo(toX(s.bounds.x0), toY(s.thr));
        ctx.lineTo(toX(s.bounds.x1), toY(s.thr));
      }
      ctx.stroke();
    });

    pts.forEach((p) => {
      ctx.fillStyle = p.label ? "#6ee0c4" : "#ef7b6c";
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  root.querySelector("#depth").oninput = (e) => {
    root.querySelector("#dv").textContent = e.target.value;
    rebuild();
  };
  root.querySelector("#rebuild").onclick = rebuild;
  root.querySelector("#newdata").onclick = () => {
    pts = makeData();
    rebuild();
  };

  rebuild();
  let raf;
  const loop = () => {
    draw();
    raf = requestAnimationFrame(loop);
  };
  loop();
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

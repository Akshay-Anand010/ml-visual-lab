import { labShell, setupCanvas, setInspect, paintStage } from "../ui.js";
import { playgroundClassify } from "../data/playground.js";
import { pathBannerHtml, bindPathBanner } from "../path.js";

function gini(labels) {
  if (!labels.length) return 0;
  const p = labels.filter((l) => l === 1).length / labels.length;
  return 1 - p * p - (1 - p) * (1 - p);
}

function bestSplit(pts) {
  let best = null;
  ["x", "y"].forEach((axis) => {
    const vals = [...new Set(pts.map((p) => +p[axis].toFixed(3)))].sort((a, b) => a - b);
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
  const { canvas, inspect } = labShell(root, {
    title: "Decision tree",
    kicker: "Chapter 1 · Classical ML",
    body: "Same shared playground as logistic and k-NN. Axis-aligned splits carve rectangles. Raise depth until train accuracy looks perfect — that is the overfitting failure mode.",
    formula: "split = argmin Gini(left)+Gini(right)\nleaf → majority class",
    guideKey: "tree",
    notesHref: "#/notes?doc=Decision%20Tree%2FBeautified_Decision_Tree_Algorithm.pdf",
    bannerHtml: pathBannerHtml("path-tree"),
    controlsHtml: `
      <label class="ctrl">Max depth <span id="dv" class="stat">2</span>
        <input id="depth" type="range" min="1" max="8" step="1" value="2" />
      </label>
      <label class="ctrl">Playground seed <span id="seedv" class="stat">42</span>
        <input id="seed" type="range" min="1" max="99" step="1" value="42" />
      </label>
      <label class="ctrl fail">
        <input id="overfit" type="checkbox" /> Show overfitting hint (depth ≥ 6)
      </label>
      <div class="btn-row">
        <button id="rebuild">Rebuild tree</button>
      </div>
      <p class="explain" id="status"></p>
    `,
  });
  bindPathBanner(root);

  const { ctx, resize, cssSize } = setupCanvas(canvas);
  let pts = playgroundClassify(42);
  let tree = buildTree(pts, 0, 2);

  function rebuild() {
    let d = Number(root.querySelector("#depth").value);
    if (root.querySelector("#overfit").checked) d = Math.max(d, 6);
    tree = buildTree(pts, 0, d);
    const acc = pts.filter((p) => predict(tree, p) === p.label).length / pts.length;
    const warn = d >= 6 ? " · <span class=\"stat\">overfit risk: jagged regions</span>" : "";
    root.querySelector("#status").innerHTML =
      `depth ${d} · train acc <span class="stat">${(acc * 100).toFixed(0)}%</span> · shared playground${warn}`;
  }

  function draw() {
    const { w: W, h: H } = cssSize();
    const C = paintStage(ctx, W, H);
    const pad = 36;
    const toX = (x) => pad + ((x + 1.2) / 2.4) * (W - pad * 2);
    const toY = (y) => H - pad - ((y + 1.2) / 2.4) * (H - pad * 2);
    const splits = listSplits(tree, { x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2 });
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
    ctx.strokeStyle = C.brass;
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
      ctx.fillStyle = p.label ? C.teal : C.coral;
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  canvas.addEventListener("pointermove", (e) => {
    const { w: W, h: H } = cssSize();
    const pad = 36;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - pad) / (W - pad * 2)) * 2.4 - 1.2;
    const y = ((H - pad - (e.clientY - rect.top)) / (H - pad * 2)) * 2.4 - 1.2;
    setInspect(inspect, `Region label at pointer: ${predict(tree, { x, y })} · splits=${listSplits(tree, { x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2 }).length}`);
  });

  root.querySelector("#depth").oninput = (e) => {
    root.querySelector("#dv").textContent = e.target.value;
    rebuild();
  };
  root.querySelector("#seed").oninput = (e) => {
    root.querySelector("#seedv").textContent = e.target.value;
  };
  root.querySelector("#seed").onchange = () => {
    pts = playgroundClassify(Number(root.querySelector("#seed").value));
    rebuild();
  };
  root.querySelector("#overfit").onchange = rebuild;
  root.querySelector("#rebuild").onclick = rebuild;

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

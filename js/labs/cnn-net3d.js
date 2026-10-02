import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const LAYERS = [
  {
    id: "in",
    name: "Input crop",
    shape: "64 × 64 × 3",
    size: [2.6, 2.6, 0.35],
    color: 0xe0b07a,
    body: "Your photo is center-cropped and resized to 64×64 RGB. That tensor is what the CNN actually sees — a small, cheap volume so the site stays fast.",
  },
  {
    id: "c1",
    name: "Conv block 1",
    shape: "32 × 32 × 24",
    size: [2.1, 2.1, 0.7],
    color: 0x7ee8cc,
    body: "3×3 convolution, stride 2, batch-norm, SiLU. It halves space and lifts 3 color channels to 24 feature maps — edges, blobs, skin-vs-background.",
  },
  {
    id: "c2",
    name: "Conv block 2",
    shape: "16 × 16 × 48",
    size: [1.65, 1.65, 0.95],
    color: 0x7ee8cc,
    body: "Same recipe: 3×3 / stride 2. Receptive field grows. Channels double so the net can describe parts (eyes, hairline) without looking at every pixel.",
  },
  {
    id: "c3",
    name: "Conv block 3",
    shape: "8 × 8 × 72",
    size: [1.25, 1.25, 1.15],
    color: 0xc4b4ff,
    body: "Deeper features: pose, lighting direction, how close the face sits to the frame edge. Still a tiny stack — this is not a ResNet.",
  },
  {
    id: "c4",
    name: "Conv block 4",
    shape: "4 × 4 × 96",
    size: [0.95, 0.95, 1.35],
    color: 0xc4b4ff,
    body: "Last spatial grid. 96 maps on a 4×4 board — compact enough to pool, rich enough to drive the transform head.",
  },
  {
    id: "gap",
    name: "Global average pool",
    shape: "96",
    size: [0.55, 0.55, 1.5],
    color: 0xf08a7c,
    body: "AdaptiveAvgPool2d(1) squashes each map to one number. Translation-ish summary: “what is in the photo”, not a precise pixel grid.",
  },
  {
    id: "z",
    name: "Latent z",
    shape: "32",
    size: [0.5, 0.5, 0.9],
    color: 0xf08a7c,
    body: "Linear 96 → 32. This code is the identity fingerprint the head reads. We never decode a new face from z — we only use it to pick safe warps.",
  },
  {
    id: "head",
    name: "Param head μ, σ",
    shape: "10 + 10",
    size: [0.7, 0.7, 1.1],
    color: 0xe0b07a,
    body: "SiLU MLPs emit 10 means and 10 log-stds: rotation, scale, translate, shear, brightness, contrast, saturation, hue, warp. Softplus keeps σ positive.",
  },
  {
    id: "stn",
    name: "Spatial transformer",
    shape: "affine 2 × 3 + grid",
    size: [2.0, 2.0, 0.45],
    color: 0x7ee8cc,
    body: "Sample θ ~ 𝒩(μ, σ), build an affine matrix, add a low-frequency elastic warp, then grid_sample the original pixels. Identity stays in the photo.",
  },
  {
    id: "color",
    name: "Color jitter CNN",
    shape: "1×1 style on RGB",
    size: [2.0, 2.0, 0.28],
    color: 0xc4b4ff,
    body: "Brightness, contrast, saturation, a cheap hue mix. Photometric views of the same person — still your pixels, just relit.",
  },
  {
    id: "out",
    name: "View batch",
    shape: "50–128 JPEGs",
    size: [2.4, 2.4, 0.55],
    color: 0xe0b07a,
    body: "N is clamped from sharpness so the page stays snappy (min 50, max 128). FastAPI returns data-URL JPEGs for the gallery above.",
  },
];

function labelTexture(title, shape, ink, teal) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  g.font = "600 36px 'Source Sans 3', system-ui, sans-serif";
  g.fillStyle = ink;
  g.textAlign = "center";
  g.fillText(title, 256, 70);
  g.font = "500 26px 'IBM Plex Mono', ui-monospace, monospace";
  g.fillStyle = teal;
  g.fillText(shape, 256, 118);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

export function mountNet3d(host) {
  const wrap = document.createElement("section");
  wrap.className = "net3d";
  wrap.innerHTML = `
    <div class="net3d-head">
      <div>
        <div class="kicker">SampleCNN · 3D</div>
        <h2>Drag the stack. Click a block. Read what it does.</h2>
        <p class="lede">This is the exact pipeline in <code>server/model.py</code> — not a generic textbook CNN. ~180k parameters, CPU, identity-preserving views.</p>
      </div>
    </div>
    <div class="net3d-frame">
      <div class="net3d-stage" id="net3dStage"></div>
      <aside class="net3d-card" id="net3dCard"></aside>
    </div>
  `;
  host.appendChild(wrap);

  const stage = wrap.querySelector("#net3dStage");
  const card = wrap.querySelector("#net3dCard");

  const scene = new THREE.Scene();
  const ink = cssColor("--ink", "#f3eee6");
  const teal = cssColor("--teal", "#7ee8cc");
  const bg = cssColor("--bg-2", "#161b24");
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 22, 48);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(6.5, 5.2, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffe6c4, 1.05);
  key.position.set(8, 12, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88e0ff, 0.35);
  fill.position.set(-10, 4, -6);
  scene.add(fill);

  const floor = new THREE.GridHelper(40, 24, 0x3a4454, 0x243040);
  floor.position.y = -2.2;
  scene.add(floor);

  const group = new THREE.Group();
  scene.add(group);
  const pickables = [];
  const meshes = [];

  LAYERS.forEach((layer, i) => {
    const x = (i - (LAYERS.length - 1) / 2) * 3.15;
    const geo = new THREE.BoxGeometry(...layer.size);
    const mat = new THREE.MeshStandardMaterial({
      color: layer.color,
      roughness: 0.38,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
      emissive: layer.color,
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0, 0);
    mesh.userData.layer = layer;
    mesh.userData.index = i;
    group.add(mesh);
    pickables.push(mesh);
    meshes.push(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 })
    );
    mesh.add(edges);

    const spriteMat = new THREE.SpriteMaterial({ map: labelTexture(layer.name, layer.shape, ink, teal), transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, layer.size[1] / 2 + 0.55, 0);
    sprite.scale.set(2.8, 0.88, 1);
    mesh.add(sprite);

    if (i < LAYERS.length - 1) {
      const nextX = x + 3.15;
      const pts = [new THREE.Vector3(x + layer.size[0] / 2 + 0.08, 0, 0), new THREE.Vector3(nextX - LAYERS[i + 1].size[0] / 2 - 0.08, 0, 0)];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xe0b07a, transparent: true, opacity: 0.45 })
      );
      group.add(line);
    }
  });

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf3eee6, emissive: 0x7ee8cc, emissiveIntensity: 1.2 })
  );
  group.add(pulse);

  let selected = 0;
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();

  function show(i) {
    selected = i;
    const L = LAYERS[i];
    card.innerHTML = `
      <div class="kicker">Layer ${String(i + 1).padStart(2, "0")} / ${LAYERS.length}</div>
      <h3>${L.name}</h3>
      <p class="net3d-shape">${L.shape}</p>
      <p>${L.body}</p>
      <div class="net3d-pills">
        ${LAYERS.map(
          (l, j) => `<button type="button" class="net3d-pill ${j === i ? "on" : ""}" data-i="${j}">${j + 1}</button>`
        ).join("")}
      </div>
    `;
    card.querySelectorAll(".net3d-pill").forEach((b) => {
      b.addEventListener("click", () => show(Number(b.dataset.i)));
    });
    meshes.forEach((m, j) => {
      m.material.emissiveIntensity = j === i ? 0.42 : 0.08;
      m.material.opacity = j === i ? 1 : 0.72;
    });
  }
  show(0);

  const sph = { theta: 0.42, phi: 1.12, r: 18 };
  let dragging = false;
  let last = [0, 0];
  let auto = true;

  function cam() {
    camera.position.setFromSphericalCoords(sph.r, sph.phi, sph.theta);
    camera.lookAt(0, 0.2, 0);
  }

  const onDown = (e) => {
    dragging = true;
    auto = false;
    last = [e.clientX, e.clientY];
  };
  const onUp = () => {
    dragging = false;
  };
  const onMove = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (!dragging) return;
    const dx = e.clientX - last[0];
    const dy = e.clientY - last[1];
    last = [e.clientX, e.clientY];
    sph.theta -= dx * 0.008;
    sph.phi = Math.min(1.45, Math.max(0.35, sph.phi - dy * 0.008));
  };
  const onWheel = (e) => {
    e.preventDefault();
    sph.r = Math.min(28, Math.max(10, sph.r + e.deltaY * 0.012));
  };
  const onClick = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit) show(hit.object.userData.index);
  };

  renderer.domElement.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
  renderer.domElement.addEventListener("click", onClick);

  const ro = new ResizeObserver(() => {
    const w = Math.max(280, stage.clientWidth);
    const h = Math.max(320, stage.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  ro.observe(stage);

  let raf = 0;
  const tick = (t) => {
    if (auto) sph.theta += 0.0022;
    cam();
    const u = (t * 0.00022) % 1;
    const i = Math.min(LAYERS.length - 1, Math.floor(u * (LAYERS.length - 0.001)));
    const f = u * (LAYERS.length - 1) - i;
    const a = meshes[i].position;
    const b = meshes[Math.min(i + 1, meshes.length - 1)].position;
    pulse.position.lerpVectors(a, b, f);
    pulse.position.y = 0.15 + Math.sin(t * 0.004) * 0.08;
    raf = requestAnimationFrame(tick);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    renderer.domElement.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("wheel", onWheel);
    renderer.domElement.removeEventListener("click", onClick);
    renderer.dispose();
    wrap.remove();
  };
}

import * as THREE from '../vendor/three.module.js';

// --- Shared Materials ---
const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
const fenceMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
const metalBinMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });

// --- Dynamic Flower Material ---
function createPetalMaterial(baseColorHex, hueOffset = 0, roughness = 0.45) {
  const color = new THREE.Color(baseColorHex);
  if (hueOffset !== 0) {
    const hsl = {};
    color.getHSL(hsl);
    hsl.h = (hsl.h + (hueOffset % 60 - 30) / 360 + 1) % 1;
    color.setHSL(hsl.h, hsl.s, hsl.l);
  }
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
}

// --- Nameplate Sprite Generator ---
const nameplateCache = new Map();
export function createNameplateSprite(text) {
  const cleanName = (text || '').slice(0, 16);
  if (nameplateCache.has(cleanName)) {
    return nameplateCache.get(cleanName).clone();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 48, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(cleanName, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.85, 0.21, 1);

  nameplateCache.set(cleanName, sprite);
  return sprite.clone();
}

// --- Detailed Trash Meshes ---

// 1. Pizza Slice (Crust + Yellow Cheese + 3 Pepperonis)
export function createPizzaMesh() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-0.2, 0.42);
  shape.lineTo(0.2, 0.42);
  shape.closePath();

  const cheeseGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.01, bevelThickness: 0.01 });
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  const cheeseMesh = new THREE.Mesh(cheeseGeo, cheeseMat);
  cheeseMesh.rotation.x = -Math.PI / 2;
  cheeseMesh.position.y = 0.02;
  group.add(cheeseMesh);

  // Crust
  const crustGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8);
  const crust = new THREE.Mesh(crustGeo, new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
  crust.rotation.z = Math.PI / 2;
  crust.position.set(0, 0.04, -0.42);
  group.add(crust);

  // Pepperonis
  const pepGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 8);
  const pepMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const p1 = new THREE.Mesh(pepGeo, pepMat); p1.position.set(-0.07, 0.045, -0.24);
  const p2 = new THREE.Mesh(pepGeo, pepMat); p2.position.set(0.07, 0.045, -0.28);
  const p3 = new THREE.Mesh(pepGeo, pepMat); p3.position.set(0, 0.045, -0.14);
  group.add(p1, p2, p3);
  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

// 2. Crushed Soda Can (Metallic Red & Silver Dent)
export function createCanMesh() {
  const group = new THREE.Group();
  const canBodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.38, 12);
  const pos = canBodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (Math.abs(y) < 0.12) {
      pos.setX(i, pos.getX(i) * 0.72);
      pos.setZ(i, pos.getZ(i) * 0.82);
    }
  }
  canBodyGeo.computeVertexNormals();

  const canMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.85, roughness: 0.25 });
  group.add(new THREE.Mesh(canBodyGeo, canMat));

  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 12), rimMat);
  topRim.rotation.x = Math.PI / 2; topRim.position.y = 0.19;
  const bottomRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 12), rimMat);
  bottomRim.rotation.x = Math.PI / 2; bottomRim.position.y = -0.19;
  group.add(topRim, bottomRim);

  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.08), rimMat);
  tab.position.set(0.02, 0.195, 0.02); tab.rotation.y = 0.4;
  group.add(tab);
  group.rotation.z = Math.PI / 2;
  return group;
}

// 3. Banana Peel
export function createBananaMesh() {
  const group = new THREE.Group();
  const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }));
  stem.position.y = 0.14; group.add(stem);

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const peelGeo = new THREE.SphereGeometry(0.24, 8, 8, 0, Math.PI * 0.7, 0, Math.PI * 0.6);
    peelGeo.scale(0.35, 1.0, 0.12);
    const peel = new THREE.Mesh(peelGeo, bananaMat);
    peel.rotation.y = angle; peel.rotation.x = 0.75;
    peel.position.set(Math.cos(angle) * 0.08, 0.05, Math.sin(angle) * 0.08);
    group.add(peel);
  }
  return group;
}

// 4. Fishbone (Head + Spine + Ribs + Tail)
export function createFishboneMesh() {
  const group = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.65 });

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 5), boneMat);
  head.rotation.z = Math.PI / 2; head.position.x = -0.22; group.add(head);

  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 6), boneMat);
  spine.rotation.z = Math.PI / 2; spine.position.x = 0.05; group.add(spine);

  for (let i = 0; i < 5; i++) {
    const rx = -0.1 + i * 0.07;
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16 - Math.abs(i - 2) * 0.025, 4), boneMat);
    rib.position.set(rx, 0, 0); rib.rotation.z = 0.35; group.add(rib);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 4), boneMat);
  tail.rotation.z = -Math.PI / 2; tail.position.x = 0.33; group.add(tail);
  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

// 5. Crumpled Paper
export function createPaperMesh() {
  const geo = new THREE.DodecahedronGeometry(0.14, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const factor = 0.75 + Math.random() * 0.45;
    pos.setXYZ(i, pos.getX(i) * factor, pos.getY(i) * factor, pos.getZ(i) * factor);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95, flatShading: true }));
}

// 6. Poison Mushroom
export function createMushroomMesh() {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
  stem.position.y = 0.11; stem.rotation.z = 0.12; group.add(stem);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
  cap.position.set(0.02, 0.22, 0); group.add(cap);

  const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  [[0.08, 0.30, 0.06], [-0.06, 0.28, 0.08], [0.02, 0.34, -0.05], [-0.07, 0.26, -0.07]].forEach(([dx, dy, dz]) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), dotMat);
    dot.position.set(dx, dy, dz); group.add(dot);
  });
  return group;
}

// --- Plant & Flower Meshes ---

// Sprout
export function createSproutMesh(traits) {
  const group = new THREE.Group();
  const stemH = 0.5 * (traits?.scale || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, stemH, 8), stemMat);
  stem.position.y = stemH / 2; group.add(stem);

  const leafGeo = new THREE.SphereGeometry(0.12, 8, 6);
  leafGeo.scale(1.2, 0.25, 1.8);
  const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
  leftLeaf.position.set(-0.1, stemH - 0.02, 0); leftLeaf.rotation.set(0.2, 0, 0.55);
  const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
  rightLeaf.position.set(0.1, stemH - 0.02, 0); rightLeaf.rotation.set(-0.2, 0, -0.55);
  group.add(leftLeaf, rightLeaf);
  return group;
}

// Wildflower / Daisy
export function createWildflowerMesh(traits) {
  const group = new THREE.Group();
  const stemH = 0.7 * (traits?.scale || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, stemH, 8), stemMat);
  stem.position.y = stemH / 2; group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;
  const pMat = createPetalMaterial(0x38bdf8, traits?.hue || 200, 0.45);
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), pMat);
    petal.scale.set(0.6, 1.3, 0.25);
    petal.position.set(Math.cos(ang) * 0.16, Math.sin(ang) * 0.16, 0);
    petal.rotation.z = ang - Math.PI / 2;
    head.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 }));
  head.add(center);
  group.add(head);
  return group;
}

// Rose
export function createRoseMesh(traits) {
  const group = new THREE.Group();
  const stemH = 0.85 * (traits?.scale || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, stemH, 8), stemMat);
  stem.position.y = stemH / 2; group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;
  const pMat = createPetalMaterial(0xf43f5e, traits?.hue || 0, 0.4);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), pMat);
  head.add(core);

  for (let i = 0; i < 5; i++) {
    const ang = (i * Math.PI * 2) / 5;
    const pet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), pMat);
    pet.scale.set(0.8, 1.2, 0.3);
    pet.position.set(Math.cos(ang) * 0.12, Math.sin(ang) * 0.12, 0);
    pet.rotation.z = ang;
    head.add(pet);
  }
  group.add(head);
  return group;
}

// Sunflower
export function createSunflowerMesh(traits) {
  const group = new THREE.Group();
  const stemH = 1.1 * (traits?.scale || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, stemH, 8), stemMat);
  stem.position.y = stemH / 2; group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }));
  center.rotation.x = Math.PI / 2;
  head.add(center);

  const petalMat = createPetalMaterial(0xf59e0b, traits?.hue || 45, 0.4);
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI * 2) / 12;
    const pet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), petalMat);
    pet.scale.set(0.5, 1.4, 0.2);
    pet.position.set(Math.cos(ang) * 0.32, Math.sin(ang) * 0.32, 0);
    pet.rotation.z = ang - Math.PI / 2;
    head.add(pet);
  }
  group.add(head);
  return group;
}

// Golden Bloom
export function createGoldenMesh(traits) {
  const group = new THREE.Group();
  const stemH = 1.25 * (traits?.scale || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, stemH, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.4 }));
  stem.position.y = stemH / 2; group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xb45309, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.5 });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), goldMat);
  head.add(core);

  for (let layer = 0; layer < 2; layer++) {
    const count = 7 + layer * 3;
    const r = 0.28 + layer * 0.12;
    for (let i = 0; i < count; i++) {
      const ang = (i * Math.PI * 2) / count + layer * 0.3;
      const pet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), goldMat);
      pet.scale.set(0.6, 1.4, 0.3);
      pet.position.set(Math.cos(ang) * r, Math.sin(ang) * r, -layer * 0.03);
      pet.rotation.z = ang - Math.PI / 2;
      head.add(pet);
    }
  }
  group.add(head);
  return group;
}

// --- Corner & Edge Scenery Props (Frame Environment) ---

export function createSceneryGroup() {
  const group = new THREE.Group();

  // 1. Top-Left Corner: Hanging Ivy Vines & Dust
  const tlVine = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6.5 + i * 0.4, 3.8, 0),
      new THREE.Vector3(-6.2 + i * 0.45, 3.2 - i * 0.15, 0.05),
      new THREE.Vector3(-6.6 + i * 0.35, 2.4 - i * 0.25, -0.05),
      new THREE.Vector3(-6.3 + i * 0.4, 1.8 - i * 0.3, 0)
    ]);
    const geo = new THREE.TubeGeometry(curve, 16, 0.035, 6, false);
    tlVine.add(new THREE.Mesh(geo, stemMat));
    // Leaves along vine
    for (let t = 0.2; t <= 0.9; t += 0.2) {
      const pt = curve.getPoint(t);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), leafMat);
      leaf.scale.set(1.4, 0.2, 1.2);
      leaf.position.copy(pt);
      leaf.rotation.set(0.3, Math.random() * 3, 0.4);
      tlVine.add(leaf);
    }
  }
  group.add(tlVine);

  // 2. Top-Right Corner: Hanging Pot & Vines
  const trGroup = new THREE.Group();
  // Pot
  const potGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.32, 12);
  const pot = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 }));
  pot.position.set(6.0, 3.2, 0);
  trGroup.add(pot);
  // Hanging chain
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), metalBinMat);
  chain.position.set(6.0, 3.65, 0);
  trGroup.add(chain);
  // Vines spilling out
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(6.0 + (i - 1) * 0.1, 3.3, 0.05),
      new THREE.Vector3(6.2 + (i - 1) * 0.2, 2.7, 0.08),
      new THREE.Vector3(5.9 + (i - 1) * 0.25, 2.1, 0)
    ]);
    trGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.03, 6, false), stemMat));
  }
  group.add(trGroup);

  // 3. Bottom-Left Corner: Large Metal Trash Bin & Box
  const blGroup = new THREE.Group();
  // Trash bin
  const binGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.95, 14);
  const bin = new THREE.Mesh(binGeo, metalBinMat);
  bin.position.set(-6.2, -1.8, 0.1);
  bin.rotation.z = 0.15; // slightly tilted
  blGroup.add(bin);
  // Fallen pizza box
  const boxGeo = new THREE.BoxGeometry(0.55, 0.08, 0.55);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.set(-5.6, -2.18, 0.2);
  box.rotation.set(0.1, 0.4, -0.05);
  blGroup.add(box);
  group.add(blGroup);

  // 4. Bottom-Right Corner: Wooden Picket Fence & Watering Can
  const brGroup = new THREE.Group();
  // Fence pickets
  for (let i = 0; i < 4; i++) {
    const picket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 0.04), fenceMat);
    picket.position.set(5.2 + i * 0.35, -1.9, -0.1 + (i % 2) * 0.05);
    picket.rotation.z = (i % 2 === 0 ? 0.05 : -0.05);
    brGroup.add(picket);
  }
  // Fence rails
  const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.03), fenceMat);
  rail1.position.set(5.7, -1.75, -0.08);
  const rail2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.03), fenceMat);
  rail2.position.set(5.7, -2.05, -0.08);
  brGroup.add(rail1, rail2);
  // Watering Can
  const canMatGreen = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });
  const wCan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.38, 10), canMatGreen);
  wCan.position.set(4.7, -2.05, 0.2);
  wCan.rotation.z = -0.15;
  brGroup.add(wCan);
  group.add(brGroup);

  // 5. Bottom Floor Edge: Organic Grass & Vine Bed
  const floorCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.8, -2.25, 0),
    new THREE.Vector3(-3.5, -2.28, 0.15),
    new THREE.Vector3(0, -2.23, -0.1),
    new THREE.Vector3(3.5, -2.27, 0.12),
    new THREE.Vector3(6.8, -2.24, 0)
  ]);
  const floorVine = new THREE.Mesh(new THREE.TubeGeometry(floorCurve, 36, 0.07, 8, false), stemMat);
  group.add(floorVine);

  for (let vx = -6.2; vx <= 6.2; vx += 0.8) {
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), leafMat);
    tuft.scale.set(1.4, 0.25, 1.4);
    tuft.position.set(vx + (Math.random() * 0.2 - 0.1), -2.24, (Math.random() * 0.3 - 0.15));
    tuft.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
    group.add(tuft);
  }
  return group;
}

// --- Physics & Particle Simulation ---

export function createRenderer({ canvas }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
  dirLight.position.set(3, 8, 5);
  scene.add(dirLight);

  // Add permanent Scenery Props
  const sceneryGroup = createSceneryGroup();
  scene.add(sceneryGroup);

  // Dynamic Item Containers
  const flowersGroup = new THREE.Group();
  const trashGroup = new THREE.Group();
  const particlesGroup = new THREE.Group();
  const firefliesGroup = new THREE.Group();
  scene.add(flowersGroup);
  scene.add(trashGroup);
  scene.add(particlesGroup);
  scene.add(firefliesGroup);

  const flowersMap = new Map();
  const trashMap = new Map();
  const particles = [];
  const fireflies = [];
  let nameplatesEnabled = true;

  // Safe Zone Boundary Constants (Never place in center)
  // X range: Left corner (-6.5 ~ -4.2), Right corner (4.2 ~ 6.5), Bottom edge (-4.2 ~ 4.2 with y <= -1.8)
  const FLOOR_Y = -2.18;

  // Physics simulation objects list
  const activePhysicsItems = [];

  function spawnTrashMesh(type) {
    switch (type) {
      case 'pizza': return createPizzaMesh();
      case 'can': return createCanMesh();
      case 'banana': return createBananaMesh();
      case 'fishbone': return createFishboneMesh();
      case 'paper': return createPaperMesh();
      case 'mushroom': return createMushroomMesh();
      default: return createCanMesh();
    }
  }

  function spawnFlowerMesh(growth, blooming, isGold, traits) {
    if (isGold || growth >= 3) return createGoldenMesh(traits);
    if (growth === 2) return createSunflowerMesh(traits);
    if (growth === 1) return createRoseMesh(traits);
    if (traits?.petals > 6) return createWildflowerMesh(traits);
    return createSproutMesh(traits);
  }

  function getFlowerTopY(growth, isGold, traits) {
    const scale = traits?.scale || 1;
    if (isGold || growth >= 3) return 1.35 * scale + 0.25;
    if (growth === 2) return 1.15 * scale + 0.25;
    if (growth === 1) return 0.85 * scale + 0.2;
    return 0.55 * scale + 0.15;
  }

  // Spawn Drop Particle (Water / Leaf / Sparkle)
  function spawnParticle(x, y, vx, vy, color, size = 0.05, maxLife = 0.8) {
    if (particles.length > 80) {
      const old = particles.shift();
      particlesGroup.remove(old.mesh);
      old.mesh.geometry.dispose();
    }
    const pMesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
    );
    pMesh.position.set(x, y, (Math.random() * 0.4 - 0.2));
    particlesGroup.add(pMesh);
    particles.push({ mesh: pMesh, vx, vy, life: 0, maxLife });
  }

  // Sync Flowers with Spring Scale & Messy Placement
  function syncFlowers(flowers) {
    const activeOwners = new Set();
    const count = flowers.length;

    flowers.forEach((f, idx) => {
      activeOwners.add(f.owner);
      let record = flowersMap.get(f.owner);

      // Determine messy placement
      let targetX;
      const zone = f.traits?.preferredZone || 'bottom';
      if (zone === 'bottom-left') {
        targetX = -6.2 + (Math.sin(idx * 7) * 0.5 + 0.5) * 1.8;
      } else if (zone === 'bottom-right') {
        targetX = 4.4 + (Math.cos(idx * 7) * 0.5 + 0.5) * 1.8;
      } else {
        targetX = -4.2 + (idx / Math.max(1, count)) * 8.4 + (Math.sin(idx * 13) * 0.3);
      }

      const targetRotZ = (f.traits?.rot || 0) * 0.5;

      if (!record) {
        const mesh = spawnFlowerMesh(f.growth, f.blooming, f.isGold, f.traits);
        mesh.position.set(targetX, FLOOR_Y, (Math.random() * 0.4 - 0.2));
        mesh.rotation.z = targetRotZ;
        mesh.scale.set(0.01, 0.01, 0.01);

        const nameplate = createNameplateSprite(f.owner);
        nameplate.position.y = getFlowerTopY(f.growth, f.isGold, f.traits);
        nameplate.visible = nameplatesEnabled;
        mesh.add(nameplate);

        flowersGroup.add(mesh);
        record = {
          mesh,
          nameplate,
          growth: f.growth,
          blooming: f.blooming,
          isGold: f.isGold,
          traits: f.traits,
          currentScale: 0.01,
          targetScale: 1,
          rotZ: targetRotZ,
          jiggle: 0
        };
        flowersMap.set(f.owner, record);

        // Water drop spawn sparkles
        for (let i = 0; i < 6; i++) {
          spawnParticle(targetX, FLOOR_Y + 0.3, (Math.random() - 0.5) * 0.8, Math.random() * 1.2 + 0.4, 0x38bdf8);
        }
      } else {
        // Upgrade mesh if growth changed
        if (record.growth !== f.growth || record.blooming !== f.blooming || record.isGold !== f.isGold) {
          flowersGroup.remove(record.mesh);
          const newMesh = spawnFlowerMesh(f.growth, f.blooming, f.isGold, f.traits);
          newMesh.position.copy(record.mesh.position);
          newMesh.rotation.z = targetRotZ;
          newMesh.scale.set(record.currentScale, record.currentScale, record.currentScale);

          const nameplate = createNameplateSprite(f.owner);
          nameplate.position.y = getFlowerTopY(f.growth, f.isGold, f.traits);
          nameplate.visible = nameplatesEnabled;
          newMesh.add(nameplate);

          flowersGroup.add(newMesh);
          record.mesh = newMesh;
          record.nameplate = nameplate;
          record.growth = f.growth;
          record.blooming = f.blooming;
          record.isGold = f.isGold;
          record.currentScale = 0.5; // bounce up on growth

          // Sparkles on upgrade
          for (let i = 0; i < 8; i++) {
            spawnParticle(targetX, FLOOR_Y + 0.6, (Math.random() - 0.5) * 1.2, Math.random() * 1.5 + 0.5, f.isGold ? 0xfde047 : 0xf472b6);
          }
        }
      }
    });

    // Remove deleted flowers
    for (const [owner, record] of flowersMap.entries()) {
      if (!activeOwners.has(owner)) {
        flowersGroup.remove(record.mesh);
        flowersMap.delete(owner);
      }
    }
  }

  // Sync Trash with 2D Physics 낙하 & 바운스
  function syncTrash(trashItems) {
    const activeIds = new Set();
    trashItems.forEach(item => {
      activeIds.add(item.id);
      let record = trashMap.get(item.id);

      if (!record) {
        const mesh = spawnTrashMesh(item.type);
        // Map normalized x (-1 ~ 1) to screen space (-6.2 ~ 6.2)
        const posX = item.x * 6.0;
        const startY = 3.8 + Math.random() * 1.0; // Drop from above
        mesh.position.set(posX, startY, 0.1 + Math.random() * 0.25);
        mesh.rotation.z = (Math.random() - 0.5) * 0.8;
        trashGroup.add(mesh);

        record = {
          id: item.id,
          mesh,
          x: posX,
          y: startY,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -2.8 - Math.random() * 1.2,
          rotZ: mesh.rotation.z,
          vRot: (Math.random() - 0.5) * 4.0,
          targetRotZ: item.rotZ || ((Math.random() - 0.5) * 1.0),
          bounceCount: 0,
          isResting: false,
          scale: item.scale || 1.0
        };
        trashMap.set(item.id, record);
        activePhysicsItems.push(record);
      }
    });

    // Remove cleaned trash with poof effect
    for (const [id, record] of trashMap.entries()) {
      if (!activeIds.has(id)) {
        for (let i = 0; i < 6; i++) {
          spawnParticle(record.mesh.position.x, record.mesh.position.y + 0.1, (Math.random() - 0.5) * 1.2, Math.random() * 1.2 + 0.4, 0x4ade80);
        }
        trashGroup.remove(record.mesh);
        trashMap.delete(id);
        const pIdx = activePhysicsItems.indexOf(record);
        if (pIdx >= 0) activePhysicsItems.splice(pIdx, 1);
      }
    }
  }

  // Trigger Special Visual Effects
  function triggerWaterEffect() {
    for (let i = 0; i < 24; i++) {
      const rx = (Math.random() * 13) - 6.5;
      spawnParticle(rx, 3.8, (Math.random() - 0.5) * 0.3, -3.5 - Math.random() * 2.0, 0x38bdf8, 0.04, 1.2);
    }
  }

  function triggerSunEffect() {
    for (let i = 0; i < 30; i++) {
      const rx = (Math.random() * 12) - 6.0;
      const ry = 3.5 - Math.random() * 3.0;
      spawnParticle(rx, ry, (Math.random() - 0.5) * 0.5, Math.random() * 0.8 + 0.2, 0xfde047, 0.06, 1.4);
    }
  }

  function triggerCleanEffect() {
    for (let i = -6.0; i <= 6.0; i += 0.5) {
      spawnParticle(i, FLOOR_Y + 0.1, (Math.random() - 0.5) * 1.5, Math.random() * 1.8 + 0.5, 0x4ade80, 0.05, 0.8);
    }
  }

  function triggerGoldEffect() {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 4.0;
      const fMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 })
      );
      fMesh.position.set(Math.cos(angle) * r, FLOOR_Y + Math.random() * 3.5, Math.sin(angle) * 0.5);
      firefliesGroup.add(fMesh);
      fireflies.push({
        mesh: fMesh,
        baseX: fMesh.position.x,
        baseY: fMesh.position.y,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: 6.0 + Math.random() * 4.0
      });
    }
  }

  function triggerLaughEffect() {
    for (const record of flowersMap.values()) {
      record.jiggle = 0.35;
    }
    for (const record of activePhysicsItems) {
      record.vy = 1.8 + Math.random() * 1.0;
      record.vRot = (Math.random() - 0.5) * 6.0;
      record.isResting = false;
    }
    for (let i = 0; i < 20; i++) {
      const rx = (Math.random() * 12) - 6.0;
      spawnParticle(rx, FLOOR_Y + 0.2, (Math.random() - 0.5) * 1.0, Math.random() * 1.5 + 0.5, 0xf472b6, 0.04, 0.9);
    }
  }

  function toggleNameplates(enabled) {
    nameplatesEnabled = (enabled !== undefined) ? enabled : !nameplatesEnabled;
    for (const record of flowersMap.values()) {
      if (record.nameplate) record.nameplate.visible = nameplatesEnabled;
    }
    return nameplatesEnabled;
  }

  // Animation Update
  function update(delta) {
    const dt = Math.min(delta, 0.1);
    const time = performance.now() * 0.001;

    // 1. Physics update for falling/bouncing trash
    for (let i = 0; i < activePhysicsItems.length; i++) {
      const item = activePhysicsItems[i];
      if (item.isResting) continue;

      item.vy -= 9.8 * dt; // Gravity
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.rotZ += item.vRot * dt;

      // Floor collision check
      if (item.y <= FLOOR_Y) {
        item.y = FLOOR_Y;
        if (Math.abs(item.vy) > 0.8 && item.bounceCount < 3) {
          item.vy = -item.vy * 0.45; // Bounce
          item.vx *= 0.6;
          item.vRot *= 0.5;
          item.bounceCount++;
        } else {
          item.vy = 0;
          item.vx = 0;
          item.vRot = 0;
          item.rotZ = item.targetRotZ; // Settle into messy angle
          item.isResting = true;
        }
      }

      item.mesh.position.set(item.x, item.y, item.mesh.position.z);
      item.mesh.rotation.z = item.rotZ;
    }

    // 2. Flowers spring scale & gentle swaying
    for (const record of flowersMap.values()) {
      if (record.currentScale < record.targetScale) {
        record.currentScale += (record.targetScale - record.currentScale) * 8.0 * dt;
        const s = Math.min(1.0, record.currentScale);
        record.mesh.scale.set(s, s, s);
      }
      // Gentle wind sway
      const sway = Math.sin(time * 2.0 + record.mesh.position.x) * 0.04;
      const jiggle = record.jiggle > 0 ? Math.sin(time * 25.0) * record.jiggle : 0;
      if (record.jiggle > 0) record.jiggle = Math.max(0, record.jiggle - dt * 1.5);
      record.mesh.rotation.z = record.rotZ + sway + jiggle;
    }

    // 3. Particles update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particlesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      const progress = p.life / p.maxLife;
      p.mesh.material.opacity = Math.max(0, 1 - progress);
    }

    // 4. Fireflies wandering
    for (let i = fireflies.length - 1; i >= 0; i--) {
      const f = fireflies[i];
      f.life += dt;
      if (f.life >= f.maxLife) {
        firefliesGroup.remove(f.mesh);
        f.mesh.geometry.dispose();
        fireflies.splice(i, 1);
        continue;
      }
      f.mesh.position.x = f.baseX + Math.sin(time + f.phase) * 0.35;
      f.mesh.position.y = f.baseY + Math.cos(time * 1.2 + f.phase) * 0.25;
      f.mesh.material.opacity = 0.5 + Math.sin(time * 4.0 + f.phase) * 0.4;
    }
  }

  // Window Resize
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    syncFlowers,
    syncTrash,
    triggerWaterEffect,
    triggerSunEffect,
    triggerCleanEffect,
    triggerGoldEffect,
    triggerLaughEffect,
    toggleNameplates,
    update
  };
}


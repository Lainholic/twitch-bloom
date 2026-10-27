import * as THREE from '../vendor/three.module.js';

// Shared Materials & Palettes for high performance
const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
const rosePetalMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 });
const sunCenterMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
const sunPetalMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
const goldStemMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 });
const goldPetalMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8, roughness: 0.2 });

// Trash Materials
const canMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
const weedMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });

// 1. Sprout (Growth 0)
export function createSproutMesh(traits) {
  const group = new THREE.Group();
  const stemH = 0.5 * (traits?.height || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, stemH, 8), stemMat);
  stem.position.y = stemH / 2;
  group.add(stem);

  const leafGeo = new THREE.SphereGeometry(0.14, 8, 8);
  leafGeo.scale(1, 0.3, 1.8);
  const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
  leftLeaf.position.set(-0.12, stemH, 0);
  leftLeaf.rotation.set(0.2, 0, 0.6);
  group.add(leftLeaf);

  const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
  rightLeaf.position.set(0.12, stemH, 0);
  rightLeaf.rotation.set(-0.2, 0, -0.6);
  group.add(rightLeaf);
  return group;
}

// 2. Rose (Growth 1)
export function createRoseMesh(traits) {
  const group = new THREE.Group();
  const stemH = 0.8 * (traits?.height || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, stemH, 8), stemMat);
  stem.position.y = stemH / 2;
  group.add(stem);

  // Leaves along stem
  const leafGeo = new THREE.SphereGeometry(0.16, 8, 8);
  leafGeo.scale(1, 0.25, 1.6);
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.position.set(0.1, stemH * 0.4, 0);
  leaf.rotation.set(0.3, 0.2, -0.5);
  group.add(leaf);

  // Rose bud / flower layers
  const head = new THREE.Group();
  head.position.y = stemH;
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 6), rosePetalMat);
    petal.position.set(Math.cos(angle) * 0.1, 0.1, Math.sin(angle) * 0.1);
    petal.rotation.set(Math.sin(angle) * 0.5, angle, -Math.cos(angle) * 0.5);
    head.add(petal);
  }
  const centerBud = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), rosePetalMat);
  centerBud.position.y = 0.12;
  head.add(centerBud);
  group.add(head);
  return group;
}

// 3. Sunflower (Growth 2)
export function createSunflowerMesh(traits) {
  const group = new THREE.Group();
  const stemH = 1.1 * (traits?.height || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, stemH, 8), stemMat);
  stem.position.y = stemH / 2;
  group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;
  // Dark center disk
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), sunCenterMat);
  center.rotation.x = Math.PI / 2;
  head.add(center);

  // Radial petals
  const petalCount = traits?.petals || 10;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), sunPetalMat);
    petal.position.set(Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0);
    petal.rotation.z = angle - Math.PI / 2;
    head.add(petal);
  }
  group.add(head);
  return group;
}

// 4. Golden Flower (Growth 3 / Bloom)
export function createGoldenMesh(traits) {
  const group = new THREE.Group();
  const stemH = 1.3 * (traits?.height || 1);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, stemH, 8), goldStemMat);
  stem.position.y = stemH / 2;
  group.add(stem);

  const head = new THREE.Group();
  head.position.y = stemH;

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), goldPetalMat);
  head.add(core);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 6), goldPetalMat);
    petal.position.set(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0);
    petal.rotation.z = angle - Math.PI / 2;
    head.add(petal);
  }
  group.add(head);
  return group;
}


// Trash Meshes (Can, Banana, Fishbone, Weed)
export function createTrashMesh(type) {
  const group = new THREE.Group();
  if (type === 'can') {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.44, 12), canMat);
    can.rotation.z = Math.PI / 2 + (Math.random() * 0.4 - 0.2);
    group.add(can);
  } else if (type === 'banana') {
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const peel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.4, 6), bananaMat);
      peel.position.set(Math.cos(angle) * 0.12, 0.05, Math.sin(angle) * 0.12);
      peel.rotation.set(0.6 * Math.cos(angle), angle, 0.6 * Math.sin(angle));
      group.add(peel);
    }
  } else if (type === 'fishbone') {
    // Spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), boneMat);
    spine.rotation.z = Math.PI / 2;
    group.add(spine);
    // Head triangle
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 4), boneMat);
    head.position.x = 0.28;
    head.rotation.z = -Math.PI / 2;
    group.add(head);
    // Ribs
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4), boneMat);
      rib.position.x = i * 0.07;
      rib.rotation.y = 0.2;
      group.add(rib);
    }
  } else {
    // Weed
    const weed = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), weedMat);
    weed.scale.set(1.4, 0.7, 1.2);
    group.add(weed);
  }
  return group;
}


export function createRenderer({ canvas, onSceneReady = () => {} } = {}) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, -0.5, 9);
  camera.lookAt(0, -1.2, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Bottom Vine Base (Procedural curve)
  const vineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.5, -2.25, 0),
    new THREE.Vector3(-4.0, -2.15, 0.2),
    new THREE.Vector3(0, -2.28, -0.1),
    new THREE.Vector3(4.0, -2.18, 0.15),
    new THREE.Vector3(7.5, -2.25, 0)
  ]);
  const vineGeo = new THREE.TubeGeometry(vineCurve, 32, 0.045, 8, false);
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const vineMesh = new THREE.Mesh(vineGeo, vineMat);
  scene.add(vineMesh);

  // Containers
  const flowersGroup = new THREE.Group();
  const trashGroup = new THREE.Group();
  const particlesGroup = new THREE.Group();
  scene.add(flowersGroup);
  scene.add(trashGroup);
  scene.add(particlesGroup);

  const flowersMap = new Map();
  const trashMap = new Map();
  const particles = [];

  function spawnSparkles(x, y, count = 6, color = 0xfde047) {
    for (let i = 0; i < count; i++) {
      if (particles.length > 40) {
        const oldest = particles.shift();
        particlesGroup.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
      }
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      pMesh.position.set(x + (Math.random() * 0.4 - 0.2), y + (Math.random() * 0.4 - 0.2), (Math.random() * 0.4 - 0.2));
      particlesGroup.add(pMesh);
      particles.push({
        mesh: pMesh,
        vx: (Math.random() * 2 - 1) * 0.8,
        vy: Math.random() * 1.5 + 0.5,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4
      });
    }
  }


  function buildFlowerMesh(growth, blooming, traits) {
    if (blooming || growth >= 3) return createGoldenMesh(traits);
    if (growth === 2) return createSunflowerMesh(traits);
    if (growth === 1) return createRoseMesh(traits);
    return createSproutMesh(traits);
  }

  function syncFlowers(flowers) {
    const activeOwners = new Set();
    const totalSlots = Math.max(1, flowers.length);

    flowers.forEach((f, i) => {
      activeOwners.add(f.owner);
      // Evenly distribute or jitter across bottom width (-6.2 to 6.2)
      const slotX = ((i / totalSlots) * 12.4) - 6.2;
      let record = flowersMap.get(f.owner);

      if (!record) {
        const mesh = buildFlowerMesh(f.growth, f.blooming, f.traits);
        mesh.position.set(slotX, -2.2, (Math.random() * 0.4 - 0.2));
        mesh.scale.set(0.01, 0.01, 0.01);
        flowersGroup.add(mesh);
        record = {
          mesh,
          growth: f.growth,
          blooming: f.blooming,
          traits: f.traits,
          currentScale: 0.01,
          targetScale: 1.0,
          x: slotX,
          swayOffset: Math.random() * Math.PI * 2
        };
        flowersMap.set(f.owner, record);
        spawnSparkles(slotX, -2.0, 5, 0x4ade80);
      } else if (record.growth !== f.growth || record.blooming !== f.blooming) {
        // Growth evolution
        flowersGroup.remove(record.mesh);
        const newMesh = buildFlowerMesh(f.growth, f.blooming, f.traits);
        newMesh.position.copy(record.mesh.position);
        newMesh.scale.set(0.2, 0.2, 0.2);
        flowersGroup.add(newMesh);
        record.mesh = newMesh;
        record.growth = f.growth;
        record.blooming = f.blooming;
        record.currentScale = 0.2;
        record.targetScale = 1.0;
        spawnSparkles(newMesh.position.x, -1.8, 8, f.blooming ? 0xfde047 : 0x38bdf8);
      }
    });

    // Cleanup absent flowers
    for (const [owner, rec] of flowersMap.entries()) {
      if (!activeOwners.has(owner)) {
        flowersGroup.remove(rec.mesh);
        flowersMap.delete(owner);
      }
    }
  }

  function syncTrash(trashList) {
    const activeIds = new Set();
    trashList.forEach(t => {
      activeIds.add(t.id);
      if (!trashMap.has(t.id)) {
        const mesh = createTrashMesh(t.type);
        // Fall down from upper-bottom boundary (Y = 0.5 ~ 1.0) to floor (Y = -2.1)
        const startY = 0.8 + Math.random() * 0.4;
        mesh.position.set(t.x, startY, 0.2 + (Math.random() * 0.3 - 0.15));
        mesh.rotation.z = t.rotZ || 0;
        trashGroup.add(mesh);
        trashMap.set(t.id, {
          mesh,
          y: startY,
          targetY: -2.12 + (Math.random() * 0.06 - 0.03),
          vy: -0.5,
          isLanded: false,
          isCleaning: false
        });
      }
    });

    // Mark removed trash for clean animation
    for (const [id, item] of trashMap.entries()) {
      if (!activeIds.has(id) && !item.isCleaning) {
        item.isCleaning = true;
        item.cleanProgress = 0;
        spawnSparkles(item.mesh.position.x, item.mesh.position.y, 8, 0x38bdf8);
      }
    }
  }

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1); // Capped delta time
    const time = clock.getElapsedTime();

    // Animate Flowers
    for (const rec of flowersMap.values()) {
      if (rec.currentScale < rec.targetScale) {
        rec.currentScale = Math.min(rec.targetScale, rec.currentScale + dt * 3.0);
        rec.mesh.scale.set(rec.currentScale, rec.currentScale, rec.currentScale);
      }
      // Gentle wind swaying
      rec.mesh.rotation.z = Math.sin(time * 2.0 + rec.swayOffset) * 0.06;
      rec.mesh.rotation.x = Math.cos(time * 1.5 + rec.swayOffset) * 0.04;
    }

    // Animate Trash (Physics Drop & Clean)
    for (const [id, item] of trashMap.entries()) {
      if (item.isCleaning) {
        item.cleanProgress += dt * 3.0;
        item.mesh.position.y += dt * 2.5;
        item.mesh.rotation.y += dt * 8.0;
        const s = Math.max(0, 1 - item.cleanProgress);
        item.mesh.scale.set(s, s, s);
        if (item.cleanProgress >= 1) {
          trashGroup.remove(item.mesh);
          trashMap.delete(id);
        }
      } else if (!item.isLanded) {
        item.vy -= 18.0 * dt; // Gravity
        item.y += item.vy * dt;
        if (item.y <= item.targetY) {
          item.y = item.targetY;
          if (Math.abs(item.vy) > 1.2) {
            item.vy = -item.vy * 0.35; // Bounce
          } else {
            item.vy = 0;
            item.isLanded = true;
          }
        }
        item.mesh.position.y = item.y;
      }
    }

    // Animate Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 4.0 * dt; // Gravity
      p.mesh.material.opacity = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        particlesGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        particles.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', handleResize);

  animate();
  onSceneReady();

  return {
    scene,
    camera,
    renderer,
    syncGarden: (flowerList) => {
      syncFlowers(flowerList || []);
      syncTrash(flowerList?.trash || []);
    },
    spawnSparkles
  };
}


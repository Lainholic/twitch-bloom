// ============================================================================
// Twitch Bloom & Junkyard - 2D Retro Pixel Art Renderer
// HTML5 2D Canvas Engine (Crisp Pixelated Mode, No Three.js 3D Cylinders)
// ============================================================================

const ASSET_SRCS = {
  ivyVine: './assets/ivy_vine.png',
  trashCan: './assets/trash_can.png',
  fenceWatering: './assets/fence_watering.png',
  grassBase: './assets/grass_base.png',
  pizza: './assets/pizza.png',
  crushedCan: './assets/crushed_can.png',
  bananaPeel: './assets/banana_peel.png',
  poisonMushroom: './assets/poison_mushroom.png',
  flowerBloom: './assets/flower_bloom.png',
  goldenFlower: './assets/golden_flower.png',
  potion: './assets/potion.svg',
  fishbone: './assets/fishbone.svg',
  clover: './assets/clover.svg',
  coffeecup: './assets/coffeecup.svg',
  battery: './assets/battery.svg',
  appleCore: './assets/apple_core.svg',
};

const ASSET_BASE_SCALE = {
  // SVG 128x128 -> ~28px~32px
  potion: 0.25,
  fishbone: 0.22,
  clover: 0.22,
  coffeecup: 0.22,
  battery: 0.22,
  appleCore: 0.22,
  // PNG 48x48 -> ~30px~32px
  pizza: 0.65,
  crushedCan: 0.65,
  bananaPeel: 0.65,
  poisonMushroom: 0.65,
};

const images = {};
if (typeof Image !== 'undefined') {
  for (const [key, src] of Object.entries(ASSET_SRCS)) {
    const img = new Image();
    img.src = src;
    images[key] = img;
  }
}

// Stubs for backward export compatibility
export function createNameplateSprite(text) { return { text: String(text || '').slice(0, 16) }; }
export function createPizzaMesh() { return { type: 'pizza' }; }
export function createCanMesh() { return { type: 'can' }; }
export function createBananaMesh() { return { type: 'banana' }; }
export function createFishboneMesh() { return { type: 'fishbone' }; }
export function createPaperMesh() { return { type: 'paper' }; }
export function createMushroomMesh() { return { type: 'mushroom' }; }
export function createSproutMesh(traits) { return { type: 'sprout', traits }; }
export function createWildflowerMesh(traits) { return { type: 'wildflower', traits }; }
export function createRoseMesh(traits) { return { type: 'rose', traits }; }
export function createSunflowerMesh(traits) { return { type: 'sunflower', traits }; }
export function createGoldenMesh(traits) { return { type: 'gold', traits }; }
export function createSceneryGroup() { return { type: 'scenery' }; }

export function createRenderer({ canvas }) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  });

  const flowersMap = new Map();
  const trashMap = new Map();
  const activeTrashList = [];
  const particles = [];
  const fireflies = [];
  let nameplatesEnabled = true;
  // Static vine configs outside renderFrame to eliminate per-frame GC allocations (Sol 6.1 P1 audit fix)
  const STATIC_LEFT_VINES = [
    { x: 36, y: 12,  s: 2.1, r: -0.04, flip: false, minG: 0.0, seed: 1.1 },
    { x: 30, y: 50,  s: 2.0, r: 0.06,  flip: true,  minG: 0.1, seed: 2.3 },
    { x: 35, y: 88,  s: 2.2, r: -0.05, flip: false, minG: 0.2, seed: 3.5 },
    { x: 28, y: 126, s: 2.1, r: 0.07,  flip: true,  minG: 0.4, seed: 4.7 },
    { x: 34, y: 164, s: 2.0, r: -0.04, flip: false, minG: 0.6, seed: 5.9 },
    { x: 26, y: 202, s: 2.2, r: 0.08,  flip: true,  minG: 0.9, seed: 1.7 },
    { x: 32, y: 240, s: 2.1, r: -0.06, flip: false, minG: 1.2, seed: 2.9 },
    { x: 28, y: 278, s: 2.0, r: 0.05,  flip: true,  minG: 1.5, seed: 4.1 },
    { x: 34, y: 316, s: 2.2, r: -0.07, flip: false, minG: 1.8, seed: 5.3 },
    { x: 26, y: 354, s: 2.1, r: 0.06,  flip: true,  minG: 2.1, seed: 1.5 },
    { x: 32, y: 392, s: 2.0, r: -0.05, flip: false, minG: 2.4, seed: 2.7 },
    { x: 28, y: 430, s: 2.2, r: 0.07,  flip: true,  minG: 2.7, seed: 3.9 },
    { x: 34, y: 468, s: 2.1, r: -0.04, flip: false, minG: 3.0, seed: 5.1 },
    { x: 26, y: 506, s: 2.0, r: 0.08,  flip: true,  minG: 3.3, seed: 1.3 },
    { x: 32, y: 544, s: 2.2, r: -0.06, flip: false, minG: 3.6, seed: 2.5 },
    { x: 28, y: 582, s: 2.1, r: 0.05,  flip: true,  minG: 3.9, seed: 3.7 },
    { x: 33, y: 620, s: 2.0, r: -0.04, flip: false, minG: 4.2, seed: 4.9 },
  ];

  const STATIC_RIGHT_VINES = [
    { offsetRight: 36, y: 12,  s: 2.1, r: 0.04,  flip: true,  minG: 0.0, seed: 1.4 },
    { offsetRight: 30, y: 50,  s: 2.0, r: -0.06, flip: false, minG: 0.1, seed: 2.6 },
    { offsetRight: 35, y: 88,  s: 2.2, r: 0.05,  flip: true,  minG: 0.2, seed: 3.8 },
    { offsetRight: 28, y: 126, s: 2.1, r: -0.07, flip: false, minG: 0.4, seed: 5.0 },
    { offsetRight: 34, y: 164, s: 2.0, r: 0.04,  flip: true,  minG: 0.6, seed: 6.2 },
    { offsetRight: 26, y: 202, s: 2.2, r: -0.08, flip: false, minG: 0.9, seed: 1.9 },
    { offsetRight: 32, y: 240, s: 2.1, r: 0.06,  flip: true,  minG: 1.2, seed: 3.1 },
    { offsetRight: 28, y: 278, s: 2.0, r: -0.05, flip: false, minG: 1.5, seed: 4.3 },
    { offsetRight: 34, y: 316, s: 2.2, r: 0.07,  flip: true,  minG: 1.8, seed: 5.5 },
    { offsetRight: 26, y: 354, s: 2.1, r: -0.06, flip: false, minG: 2.1, seed: 1.7 },
    { offsetRight: 32, y: 392, s: 2.0, r: 0.05,  flip: true,  minG: 2.4, seed: 2.9 },
    { offsetRight: 28, y: 430, s: 2.2, r: -0.07, flip: false, minG: 2.7, seed: 4.1 },
    { offsetRight: 34, y: 468, s: 2.1, r: 0.04,  flip: true,  minG: 3.0, seed: 5.3 },
    { offsetRight: 26, y: 506, s: 2.0, r: -0.08, flip: false, minG: 3.3, seed: 1.5 },
    { offsetRight: 32, y: 544, s: 2.2, r: 0.06,  flip: true,  minG: 3.6, seed: 2.7 },
    { offsetRight: 28, y: 582, s: 2.1, r: -0.05, flip: false, minG: 3.9, seed: 3.9 },
    { offsetRight: 33, y: 620, s: 2.0, r: 0.04,  flip: true,  minG: 4.2, seed: 5.1 },
  ];

  const STATIC_CEILING_VINES = [
    { xOffset: 80, y: 10, s: 2.2, r: 0.04, flip: false, minG: 0.0, seed: 1.5 },
    { xOffset: 145, y: 16, s: 2.1, r: -0.05, flip: true, minG: 0.2, seed: 2.7 },
    { xOffset: 215, y: 12, s: 2.3, r: 0.06, flip: false, minG: 0.4, seed: 3.9 },
    { xOffset: 290, y: 18, s: 2.1, r: -0.04, flip: true, minG: 0.6, seed: 4.5 },
    { ratio: 0.26, y: 14, s: 2.2, r: 0.05, flip: false, minG: 0.9, seed: 5.2 },
    { ratio: 0.35, y: 20, s: 2.1, r: -0.06, flip: true, minG: 1.2, seed: 6.0 },
    { ratio: 0.44, y: 15, s: 2.3, r: 0.04, flip: false, minG: 1.5, seed: 1.8 },
    { ratio: 0.53, y: 22, s: 2.1, r: -0.05, flip: true, minG: 1.5, seed: 2.9 },
    { ratio: 0.62, y: 14, s: 2.2, r: 0.06, flip: false, minG: 1.2, seed: 3.7 },
    { ratio: 0.71, y: 20, s: 2.1, r: -0.04, flip: true, minG: 0.9, seed: 4.4 },
    { offsetRight: 290, y: 18, s: 2.2, r: 0.05, flip: false, minG: 0.6, seed: 5.0 },
    { offsetRight: 215, y: 12, s: 2.3, r: -0.04, flip: true, minG: 0.4, seed: 5.8 },
    { offsetRight: 145, y: 16, s: 2.1, r: 0.05, flip: false, minG: 0.2, seed: 6.3 },
    { offsetRight: 80, y: 10, s: 2.2, r: -0.04, flip: true, minG: 0.0, seed: 6.9 },
  ];

  const getFloorY = () => height - 35;

  // Dynamic Vines System (Reacts to Water & Sunlight!)
  const vineState = {
    growth: 0.35,        // Current visible growth level (0.35 ~ 4.5)
    targetGrowth: 0.35,  // Target level (grows when watered/sunned)
    waterDew: 0,         // Dew sparkle intensity
    sunGlow: 0,          // Golden sun photosynthesis glow
    swayBonus: 0,        // Bonus sway when growing
  };

  function growVines(amount, type = 'water') {
    vineState.targetGrowth = Math.min(4.5, vineState.targetGrowth + amount);
    vineState.swayBonus = 0.25;
    if (type === 'water') {
      vineState.waterDew = 1.0;
      for (let i = 0; i < 6; i++) {
        const isLeft = Math.random() > 0.5;
        const vx = isLeft ? Math.random() * 220 + 20 : width - Math.random() * 220 - 20;
        const vy = Math.random() * (height * 0.35);
        spawnParticle(vx, vy, (Math.random() - 0.5) * 20, Math.random() * 50 + 30, '#38bdf8', 3, 0.9, 'droplet');
      }
    } else if (type === 'sun') {
      vineState.sunGlow = 1.0;
      for (let i = 0; i < 7; i++) {
        const isLeft = Math.random() > 0.5;
        const vx = isLeft ? Math.random() * 240 + 20 : width - Math.random() * 240 - 20;
        const vy = Math.random() * (height * 0.35);
        spawnParticle(vx, vy, (Math.random() - 0.5) * 40, -Math.random() * 40 - 10, '#facc15', 5, 1.2, 'sparkle');
      }
    }
  }

  function spawnParticle(x, y, vx, vy, color, size = 4, maxLife = 0.8, shape = 'square') {
    if (particles.length > 180) particles.shift();
    particles.push({ x, y, vx, vy, color, size, life: 0, maxLife, shape });
  }

  function syncFlowers(flowers) {
    const activeOwners = new Set();
    const count = flowers.length;

    flowers.forEach((f, idx) => {
      activeOwners.add(f.owner);
      let record = flowersMap.get(f.owner);
      const floorY = getFloorY();
      let targetX;
      const zone = f.traits?.preferredZone || 'bottom';

      if (zone === 'bottom-left') {
        targetX = 170 + (idx % 4) * 55 + Math.sin(idx * 7) * 20;
      } else if (zone === 'bottom-right') {
        targetX = width - 360 + (idx % 4) * 55 + Math.cos(idx * 7) * 20;
      } else {
        const spread = idx / Math.max(1, count - 1 || 1);
        const leftSide = idx % 2 === 0;
        targetX = leftSide ? 140 + spread * (width * 0.32) : width - 140 - spread * (width * 0.32);
      }

      const baseY = floorY - 26 + Math.sin(idx * 11) * 6;
      const isGold = !!f.isGold || f.growth >= 3;
      const targetScale = isGold ? 1.05 : f.growth >= 1 ? 0.85 : 0.65;
      const rotZ = ((f.traits?.rot || 0) % 0.4) - 0.2;

      if (!record) {
        record = {
          owner: f.owner, growth: f.growth, blooming: f.blooming, isGold, traits: f.traits,
          x: targetX, y: baseY, scale: 0.1, targetScale, rotZ, jiggle: 0,
        };
        flowersMap.set(f.owner, record);
        for (let i = 0; i < 6; i++) {
          spawnParticle(targetX, baseY, (Math.random() - 0.5) * 80, -Math.random() * 120 - 40, '#38bdf8', 4, 0.7);
        }
      } else {
        if (record.growth !== f.growth || record.isGold !== isGold || record.blooming !== f.blooming) {
          record.growth = f.growth; record.blooming = f.blooming; record.isGold = isGold;
          record.targetScale = targetScale; record.scale = 0.6;
          const burstColor = isGold ? '#facc15' : '#f472b6';
          for (let i = 0; i < 8; i++) {
            spawnParticle(record.x, record.y, (Math.random() - 0.5) * 110, -Math.random() * 140 - 50, burstColor, 5, 0.9, 'sparkle');
          }
        }
      }
    });

    for (const [owner] of flowersMap.entries()) {
      if (!activeOwners.has(owner)) flowersMap.delete(owner);
    }
  }

  function syncTrash(trashItems) {
    const activeIds = new Set();
    const floorY = getFloorY();

    trashItems.forEach((item) => {
      activeIds.add(item.id);
      let record = trashMap.get(item.id);

      if (!record) {
        let posX = (width / 2) + item.x * (width * 0.46);
        if (posX < 65) posX = 65 + Math.random() * 25;
        if (posX > width - 65) posX = width - 90 + Math.random() * 25;

        const startY = -40 - Math.random() * 60;
        const targetAngle = ((Math.random() - 0.5) * Math.PI) * 0.4;
        const targetFloorOffset = (Math.random() - 0.5) * 8;

        // --- Vertical pile-up height accumulation ---
        let baseLandingY = floorY - 14 + targetFloorOffset;
        let highestBelowY = baseLandingY;
        let pileCount = 0;

        for (let i = 0; i < activeTrashList.length; i++) {
          const other = activeTrashList[i];
          if (other.isResting && Math.abs(other.x - posX) < 22) {
            pileCount++;
            if (other.targetY < highestBelowY) {
              highestBelowY = other.targetY;
            }
          }
        }

        // Stack up to 5 layers (each layer ~10~13px)
        let finalTargetY = baseLandingY;
        if (pileCount > 0 && highestBelowY > floorY - 65) {
          finalTargetY = highestBelowY - (10 + Math.random() * 3);
        }

        let spriteKey = 'crushedCan';
        if (item.type === 'pizza') spriteKey = 'pizza';
        else if (item.type === 'banana') spriteKey = 'bananaPeel';
        else if (item.type === 'mushroom') spriteKey = 'poisonMushroom';
        else if (item.type === 'can') spriteKey = 'crushedCan';
        else if (item.type === 'fishbone' || item.type === 'fish') spriteKey = 'fishbone';
        else if (item.type === 'coffee' || item.type === 'cup') spriteKey = 'coffeecup';
        else if (item.type === 'battery') spriteKey = 'battery';
        else if (item.type === 'apple' || item.type === 'core') spriteKey = 'appleCore';
        else if (item.type === 'clover') spriteKey = 'clover';
        else if (item.type === 'potion') spriteKey = 'potion';
        else if (item.type === 'paper') spriteKey = 'coffeecup';
        else {
          const pool = ['pizza', 'crushedCan', 'bananaPeel', 'poisonMushroom', 'fishbone', 'coffeecup', 'battery', 'appleCore', 'clover', 'potion'];
          spriteKey = pool[Math.floor(Math.random() * pool.length)];
        }

        const baseSc = ASSET_BASE_SCALE[spriteKey] || 0.65;
        const scaleVal = baseSc * (0.85 + Math.random() * 0.35);
        const flipH = Math.random() > 0.5;

        record = {
          id: item.id, type: item.type, spriteKey, x: posX, y: startY,
          targetY: finalTargetY,
          vx: (Math.random() - 0.5) * 70, vy: 240 + Math.random() * 140,
          rot: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 7.0,
          targetRot: targetAngle, bounceCount: 0, isResting: false,
          scale: scaleVal,
          flipH: flipH,
        };
        trashMap.set(item.id, record);
        activeTrashList.push(record);
      }
    });

    for (const [id, record] of trashMap.entries()) {
      if (!activeIds.has(id)) {
        for (let i = 0; i < 7; i++) {
          spawnParticle(record.x, record.y, (Math.random() - 0.5) * 90, -Math.random() * 110 - 40, '#4ade80', 4, 0.6);
        }
        trashMap.delete(id);
        const idx = activeTrashList.indexOf(record);
        if (idx >= 0) activeTrashList.splice(idx, 1);

        // When a bottom item is cleared, items resting above it settle down
        for (let j = 0; j < activeTrashList.length; j++) {
          const above = activeTrashList[j];
          if (above.isResting && Math.abs(above.x - record.x) < 22 && above.targetY < record.targetY) {
            above.targetY = Math.min(floorY - 14, above.targetY + 11);
            above.isResting = false;
            above.vy = 50;
            above.bounceCount = 1;
          }
        }
      }
    }
  }

  function triggerWaterEffect() {
    growVines(0.18, 'water');
    for (let i = 0; i < 35; i++) {
      spawnParticle(Math.random() * width, Math.random() * 80, (Math.random() - 0.5) * 20, 350 + Math.random() * 250, '#38bdf8', 4, 1.2, 'droplet');
    }
  }

  function triggerSunEffect() {
    growVines(0.25, 'sun');
    for (let i = 0; i < 36; i++) {
      spawnParticle(Math.random() * width, height - Math.random() * (height * 0.45), (Math.random() - 0.5) * 40, -Math.random() * 70 - 20, '#facc15', 5, 1.5, 'sparkle');
    }
  }

  function triggerCleanEffect() {
    const floorY = getFloorY();
    for (let i = 0; i < 40; i++) {
      spawnParticle((i / 40) * width + (Math.random() - 0.5) * 40, floorY - 10 + (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 160, -Math.random() * 140 - 50, '#4ade80', 5, 0.8);
    }
  }

  function triggerGoldEffect() {
    growVines(0.40, 'sun');
    const floorY = getFloorY();
    for (let i = 0; i < 28; i++) {
      if (fireflies.length >= 60) fireflies.shift();
      fireflies.push({
        baseX: (Math.random() * 0.9 + 0.05) * width,
        baseY: floorY - 30 - Math.random() * (height * 0.45),
        x: 0, y: 0, phase: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 1.5, radius: 20 + Math.random() * 35,
        life: 0, maxLife: 5.0 + Math.random() * 4.0,
        color: Math.random() > 0.4 ? '#fde047' : '#fef08a',
        size: 4 + Math.floor(Math.random() * 3),
      });
    }
  }

  function triggerLaughEffect() {
    for (const record of flowersMap.values()) record.jiggle = 0.25;
    // Controlled jiggle: bounce up to 4 resting items softly without blasting all items into the sky
    let bounced = 0;
    for (const item of activeTrashList) {
      if (item.isResting && bounced < 4) {
        item.vy = -75 - Math.random() * 35;
        item.vRot = (Math.random() - 0.5) * 3.0;
        item.isResting = false;
        item.bounceCount = 1;
        bounced++;
      }
    }
    const floorY = getFloorY();
    // Soft subtle hearts (6 instead of 20 to prevent clutter)
    for (let i = 0; i < 6; i++) {
      spawnParticle(Math.random() * width, floorY - 20, (Math.random() - 0.5) * 50, -Math.random() * 80 - 20, '#f472b6', 4, 0.8, 'heart');
    }
  }

  function toggleNameplates(enabled) {
    nameplatesEnabled = (enabled !== undefined) ? enabled : !nameplatesEnabled;
    return nameplatesEnabled;
  }

  function update(delta) {
    const dt = Math.min(delta, 0.1);
    const time = performance.now() * 0.001;

    for (let i = 0; i < activeTrashList.length; i++) {
      const item = activeTrashList[i];
      if (item.isResting) continue;
      item.vy += 650 * dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.rot += item.vRot * dt;

      if (item.y >= item.targetY) {
        item.y = item.targetY;
        if (Math.abs(item.vy) > 80 && item.bounceCount < 2) {
          item.vy = -item.vy * 0.42;
          item.vx *= 0.6;
          item.vRot *= 0.5;
          item.bounceCount++;
          spawnParticle(item.x, item.y + 10, (Math.random() - 0.5) * 40, -30, '#94a3b8', 3, 0.4);
        } else {
          item.vy = 0; item.vx = 0; item.vRot = 0;
          item.rot = item.targetRot;
          item.isResting = true;
        }
      }
    }

    for (const record of flowersMap.values()) {
      if (record.scale < record.targetScale) record.scale += (record.targetScale - record.scale) * 8.0 * dt;
      if (record.jiggle > 0) record.jiggle = Math.max(0, record.jiggle - dt * 1.5);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }

    for (let i = fireflies.length - 1; i >= 0; i--) {
      const f = fireflies[i];
      f.life += dt;
      if (f.life >= f.maxLife) { fireflies.splice(i, 1); continue; }
      f.x = f.baseX + Math.sin(time * f.speed + f.phase) * f.radius;
      f.y = f.baseY + Math.cos(time * (f.speed * 1.2) + f.phase) * (f.radius * 0.6);
    }

    // Vines smooth growth & glow decay
    vineState.growth += (vineState.targetGrowth - vineState.growth) * 3.5 * dt;
    if (vineState.waterDew > 0) vineState.waterDew = Math.max(0, vineState.waterDew - dt * 1.2);
    if (vineState.sunGlow > 0) vineState.sunGlow = Math.max(0, vineState.sunGlow - dt * 1.0);
    if (vineState.swayBonus > 0) vineState.swayBonus = Math.max(0, vineState.swayBonus - dt * 1.5);
  }

  function drawSprite(img, cx, cy, scale, rot = 0, flipH = false, alpha = 1.0) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    ctx.save();
    if (alpha < 1.0) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(Math.round(cx), Math.round(cy));
    if (rot !== 0) ctx.rotate(rot);
    if (flipH) ctx.scale(-1, 1);
    ctx.drawImage(img, -Math.round(w / 2), -Math.round(h / 2), w, h);
    ctx.restore();
  }

  function drawNameplate(text, cx, cy, isGold) {
    if (!nameplatesEnabled || !text) return;
    ctx.save();
    ctx.font = 'bold 10px monospace, "Courier New", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const clean = text.slice(0, 14);
    const boxW = Math.max(40, Math.round(ctx.measureText(clean).width + 10));
    const boxH = 15;
    const boxX = Math.round(cx - boxW / 2);
    const boxY = Math.round(cy - boxH / 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = isGold ? '#facc15' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
    ctx.fillStyle = isGold ? '#fef08a' : '#f8fafc';
    ctx.fillText(clean, cx, cy);
    ctx.restore();
  }

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const time = performance.now() * 0.001;
    const floorY = getFloorY();

    // 1. Ceiling & Wall Trailing Ivy Vines (Continuous, lush, organic overlapping canopy & cascades!)
    if (images.ivyVine && images.ivyVine.complete) {
      const g = vineState.growth;
      const extraSway = vineState.swayBonus * Math.sin(time * 6.0);

      // Left Wall cascading down (Zero-allocation static array)
      for (let i = 0; i < STATIC_LEFT_VINES.length; i++) {
        const p = STATIC_LEFT_VINES[i];
        if (g < p.minG) continue;
        const fade = Math.min(1.0, (g - p.minG) / 0.3);
        const sway = Math.sin(time * 1.5 + p.seed) * 0.05 + extraSway;
        drawSprite(images.ivyVine, p.x, p.y, p.s * fade, p.r + sway, p.flip, fade);
      }

      // Right Wall cascading down (Zero-allocation static array)
      for (let i = 0; i < STATIC_RIGHT_VINES.length; i++) {
        const p = STATIC_RIGHT_VINES[i];
        if (g < p.minG) continue;
        const fade = Math.min(1.0, (g - p.minG) / 0.3);
        const sway = Math.sin(time * 1.5 + p.seed) * 0.05 + extraSway;
        const px = width - p.offsetRight;
        drawSprite(images.ivyVine, px, p.y, p.s * fade, p.r + sway, p.flip, fade);
      }

      // Ceiling hanging canopy (Zero-allocation static array)
      for (let i = 0; i < STATIC_CEILING_VINES.length; i++) {
        const p = STATIC_CEILING_VINES[i];
        if (g < p.minG) continue;
        const fade = Math.min(1.0, (g - p.minG) / 0.3);
        const sway = Math.sin(time * 1.3 + p.seed) * 0.04 + extraSway * 0.7;
        const px = p.ratio ? width * p.ratio : p.offsetRight ? width - p.offsetRight : p.xOffset;
        drawSprite(images.ivyVine, px, p.y, p.s * fade, p.r + sway, p.flip, fade);
      }
    }

    // 2. Bottom Grass Tiles (1:1 Ratio, Subtle floor trim)
    if (images.grassBase && images.grassBase.complete) {
      const tileWidth = 64 * 1.4;
      const tileCount = Math.ceil(width / tileWidth) + 2;
      for (let i = 0; i < tileCount; i++) {
        drawSprite(images.grassBase, i * tileWidth - 10, floorY + 12 + Math.sin(i * 1.9) * 3, 1.4, 0, i % 2 === 1);
      }
    }

    // 3. Bottom-Right Fence & Watering Can & Clovers (1:1 Ratio, Compact)
    if (images.fenceWatering && images.fenceWatering.complete) {
      drawSprite(images.fenceWatering, width - 85, floorY - 20, 1.4, 0, false);
      if (images.clover && images.clover.complete) {
        drawSprite(images.clover, width - 118, floorY - 5, 0.22, 0.1);
        drawSprite(images.clover, width - 42, floorY - 4, 0.20, -0.15, true);
      }
    }

    // 4. Bottom-Left Street Trash Can & Base Litter (1:1 Ratio, Compact & Cute)
    if (images.trashCan && images.trashCan.complete) {
      drawSprite(images.trashCan, 60, floorY - 22, 1.4, -0.04, false);
      if (images.crushedCan && images.crushedCan.complete) drawSprite(images.crushedCan, 24, floorY - 5, 0.60, -0.45);
      if (images.fishbone && images.fishbone.complete) drawSprite(images.fishbone, 38, floorY - 4, 0.22, 0.15);
      if (images.bananaPeel && images.bananaPeel.complete) drawSprite(images.bananaPeel, 98, floorY - 5, 0.60, 0.35, true);
      if (images.coffeecup && images.coffeecup.complete) drawSprite(images.coffeecup, 116, floorY - 5, 0.22, -0.2);
      if (images.battery && images.battery.complete) drawSprite(images.battery, 134, floorY - 4, 0.20, 0.4);
      if (images.poisonMushroom && images.poisonMushroom.complete) drawSprite(images.poisonMushroom, 152, floorY - 6, 0.55, 0.15);
    }

    // 5. Dynamic Flowers (1:1 Ratio, Small & Crisp)
    for (const record of flowersMap.values()) {
      const sway = Math.sin(time * 2.2 + record.x) * 0.05;
      const jiggle = record.jiggle > 0 ? Math.sin(time * 30.0) * record.jiggle : 0;
      const flowerImg = record.isGold ? images.goldenFlower : images.flowerBloom;
      drawSprite(flowerImg, record.x, record.y, record.scale, record.rotZ + sway + jiggle);
      if (record.isGold && Math.random() < 0.25) {
        spawnParticle(record.x + (Math.random() - 0.5) * 20, record.y - 8, 0, -25, '#fef08a', 3, 0.6, 'sparkle');
      }
      drawNameplate(record.owner, record.x, record.y - (20 * (record.scale / 0.85)), record.isGold);
    }

    // 6. Dynamic Falling/Stacked Trash (including potion bottles, pizza, cans, etc.)
    for (const item of activeTrashList) {
      const img = images[item.spriteKey] || images.crushedCan;
      drawSprite(img, item.x, item.y, item.scale, item.rot, item.flipH);
    }

    // 7. Particles
    for (const p of particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'droplet') {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 5);
      } else if (p.shape === 'sparkle') {
        const sz = Math.round(p.size);
        ctx.fillRect(Math.round(p.x - sz / 2), Math.round(p.y), sz, 2);
        ctx.fillRect(Math.round(p.x), Math.round(p.y - sz / 2), 2, sz);
      } else if (p.shape === 'heart') {
        ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 2), 2, 2);
        ctx.fillRect(Math.round(p.x + 2), Math.round(p.y - 2), 2, 2);
        ctx.fillRect(Math.round(p.x - 3), Math.round(p.y), 8, 2);
        ctx.fillRect(Math.round(p.x - 1), Math.round(p.y + 2), 4, 2);
        ctx.fillRect(Math.round(p.x), Math.round(p.y + 4), 2, 2);
      } else {
        const s = Math.round(p.size);
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }
      ctx.restore();
    }

    // 8. Fireflies
    for (const f of fireflies) {
      const alpha = Math.max(0, 1 - f.life / f.maxLife) * (0.6 + Math.sin(time * 5.0 + f.phase) * 0.35);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      const sz = Math.round(f.size);
      ctx.fillRect(Math.round(f.x - sz / 2), Math.round(f.y - sz / 2), sz, sz);
      ctx.restore();
    }
  }

  const scene = {
    children: [],
    add: function(obj) { if (obj && !this.children.includes(obj)) this.children.push(obj); },
    remove: function(obj) {
      const idx = this.children.indexOf(obj);
      if (idx >= 0) this.children.splice(idx, 1);
    },
  };

  const camera = { position: { x: 0, y: 0, z: 7.2 }, aspect: 1, updateProjectionMatrix: () => {} };

  const renderer = {
    domElement: canvas,
    render: () => { renderFrame(); },
    setSize: (w, h) => {
      width = canvas.width = w;
      height = canvas.height = h;
      ctx.imageSmoothingEnabled = false;
    },
    setPixelRatio: () => {},
    setClearColor: () => {},
  };

  return {
    scene, camera, renderer,
    syncFlowers, syncTrash,
    triggerWaterEffect, triggerSunEffect, triggerCleanEffect, triggerGoldEffect, triggerLaughEffect,
    toggleNameplates, update,
  };
}



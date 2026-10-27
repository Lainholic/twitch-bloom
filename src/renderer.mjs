// ============================================================================
// Twitch Bloom & Junkyard - 2D Retro Pixel Art Renderer
// HTML5 2D Canvas Engine (Crisp Pixelated Mode, No Three.js 3D Cylinders)
// ============================================================================

const ASSET_SRCS = {
  vinePot: './assets/vine_pot.png',
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
  potion: 0.38,
  fishbone: 0.36,
  clover: 0.36,
  coffeecup: 0.36,
  battery: 0.36,
  appleCore: 0.36,
  pizza: 0.95,
  crushedCan: 0.95,
  bananaPeel: 0.95,
  poisonMushroom: 0.95,
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
  const potionsList = [];
  const particles = [];
  const fireflies = [];
  let nameplatesEnabled = true;

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

  function spawnPotion(customX = null) {
    const floorY = getFloorY();
    const posX = (customX !== null) ? customX : (200 + Math.random() * (width - 400));
    const startY = -40 - Math.random() * 50;
    const targetFloorOffset = (Math.random() - 0.5) * 14;
    const targetAngle = ((Math.random() - 0.5) * Math.PI) * 0.25;

    const potionRecord = {
      id: 'potion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      x: posX,
      y: startY,
      targetY: floorY - 14 + targetFloorOffset,
      vx: (Math.random() - 0.5) * 50,
      vy: 200 + Math.random() * 100,
      rot: (Math.random() - 0.5) * 1.5,
      vRot: (Math.random() - 0.5) * 4.0,
      targetRot: targetAngle,
      bounceCount: 0,
      isResting: false,
      scale: ASSET_BASE_SCALE.potion * (0.95 + Math.random() * 0.15),
      glowPhase: Math.random() * Math.PI * 2,
    };
    potionsList.push(potionRecord);
    if (potionsList.length > 12) potionsList.shift();

    for (let i = 0; i < 8; i++) {
      spawnParticle(posX, 40, (Math.random() - 0.5) * 60, Math.random() * 70, '#c084fc', 4, 1.0, 'sparkle');
    }
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
      const targetScale = isGold ? 1.45 : f.growth >= 1 ? 1.25 : 0.95;
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
          record.targetScale = targetScale; record.scale = 0.8;
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
        let posX = (width / 2) + item.x * (width * 0.45);
        if (posX < 60) posX = 60 + Math.random() * 80;
        if (posX > width - 60) posX = width - 140 + Math.random() * 80;

        const startY = -40 - Math.random() * 60;
        const targetAngle = ((Math.random() - 0.5) * Math.PI) * 0.5;
        const targetFloorOffset = (Math.random() - 0.5) * 20;

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
        else {
          const pool = ['pizza', 'crushedCan', 'bananaPeel', 'poisonMushroom', 'fishbone', 'coffeecup', 'battery', 'appleCore', 'clover'];
          spriteKey = pool[Math.floor(Math.random() * pool.length)];
        }

        const baseSc = ASSET_BASE_SCALE[spriteKey] || 0.95;
        const scaleVal = baseSc * (0.85 + Math.random() * 0.30);

        record = {
          id: item.id, type: item.type, spriteKey, x: posX, y: startY,
          targetY: floorY - 14 + targetFloorOffset,
          vx: (Math.random() - 0.5) * 70, vy: 240 + Math.random() * 140,
          rot: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 7.0,
          targetRot: targetAngle, bounceCount: 0, isResting: false,
          scale: scaleVal,
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
    for (const p of potionsList) {
      for (let i = 0; i < 6; i++) {
        spawnParticle(p.x, p.y, (Math.random() - 0.5) * 60, -Math.random() * 80 - 20, '#c084fc', 4, 0.7, 'sparkle');
      }
    }
    potionsList.length = 0;
  }

  function triggerGoldEffect() {
    growVines(0.40, 'sun');
    spawnPotion();
    const floorY = getFloorY();
    for (let i = 0; i < 28; i++) {
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
    for (const record of flowersMap.values()) record.jiggle = 0.45;
    for (const item of activeTrashList) {
      item.vy = -180 - Math.random() * 120;
      item.vRot = (Math.random() - 0.5) * 8.0;
      item.isResting = false;
      item.bounceCount = 0;
    }
    const floorY = getFloorY();
    for (let i = 0; i < 20; i++) {
      spawnParticle(Math.random() * width, floorY - 20, (Math.random() - 0.5) * 70, -Math.random() * 130 - 30, '#f472b6', 4, 1.0, 'heart');
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

    // Update Potions physics & magical glow/sparkle
    for (let i = 0; i < potionsList.length; i++) {
      const p = potionsList[i];
      p.glowPhase += dt * 3.2;
      if (!p.isResting) {
        p.vy += 600 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;

        if (p.y >= p.targetY) {
          p.y = p.targetY;
          if (Math.abs(p.vy) > 70 && p.bounceCount < 2) {
            p.vy = -p.vy * 0.36;
            p.vx *= 0.6;
            p.vRot *= 0.5;
            p.bounceCount++;
            spawnParticle(p.x, p.y + 6, (Math.random() - 0.5) * 30, -25, '#c084fc', 3, 0.4, 'sparkle');
          } else {
            p.vy = 0; p.vx = 0; p.vRot = 0;
            p.rot = p.targetRot;
            p.isResting = true;
          }
        }
      } else {
        if (Math.random() < 0.04) {
          spawnParticle(p.x + (Math.random() - 0.5) * 16, p.y - 10, (Math.random() - 0.5) * 14, -Math.random() * 25 - 8, '#e879f9', 3, 0.8, 'sparkle');
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

  function drawSprite(img, cx, cy, scale, rot = 0, flipH = false, alpha = 1.0, scaleY = null) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const sy = (scaleY !== null) ? scaleY : scale;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * sy;
    ctx.save();
    if (alpha < 1.0) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(cx, cy);
    if (rot !== 0) ctx.rotate(rot);
    if (flipH) ctx.scale(-1, 1);
    ctx.drawImage(img, -Math.round(w / 2), -Math.round(h / 2), Math.round(w), Math.round(h));
    ctx.restore();
  }

  function drawNameplate(text, cx, cy, isGold) {
    if (!nameplatesEnabled || !text) return;
    ctx.save();
    ctx.font = 'bold 11px monospace, "Courier New", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const clean = text.slice(0, 14);
    const boxW = Math.max(48, Math.round(ctx.measureText(clean).width + 16));
    const boxH = 18;
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

    // 1. Ceiling & Wall Trailing Ivy Vines (Natural Ivy with NO pots/planters!)
    const vineImg = (images.ivyVine && images.ivyVine.complete) ? images.ivyVine : images.vinePot;
    if (vineImg && vineImg.complete) {
      const g = vineState.growth;
      const stretchY = 1.0 + (g - 0.35) * 0.28;
      const extraSway = vineState.swayBonus * Math.sin(time * 6.0);

      const tlPots = [
        { x: 35, y: 15, sx: 2.2, sy: 2.2 * stretchY, r: -0.05, flip: false, seed: 1.1, minG: 0.0 },
        { x: 100, y: -5, sx: 2.6, sy: 2.6 * stretchY, r: 0.08, flip: true, seed: 2.4, minG: 0.0 },
        { x: 170, y: 18, sx: 2.0, sy: 2.0 * stretchY, r: -0.12, flip: false, seed: 3.7, minG: 0.5 },
        { x: -10, y: 38, sx: 2.4, sy: 2.4 * stretchY, r: 0.14, flip: false, seed: 5.9, minG: 0.8 },
        { x: 25, y: 110, sx: 2.1, sy: 2.3 * stretchY, r: -0.08, flip: true, seed: 4.1, minG: 1.4 },
        { x: 80, y: 85, sx: 1.9, sy: 2.1 * stretchY, r: 0.10, flip: false, seed: 2.8, minG: 1.9 },
        { x: 18, y: 190, sx: 2.0, sy: 2.2 * stretchY, r: -0.06, flip: false, seed: 6.2, minG: 2.6 },
        { x: 235, y: -10, sx: 2.3, sy: 2.4 * stretchY, r: 0.06, flip: true, seed: 4.2, minG: 3.2 },
      ];

      const trPots = [
        { x: width - 40, y: 10, sx: 2.4, sy: 2.4 * stretchY, r: 0.06, flip: true, seed: 1.5, minG: 0.0 },
        { x: width - 110, y: -8, sx: 2.7, sy: 2.7 * stretchY, r: -0.1, flip: false, seed: 2.9, minG: 0.0 },
        { x: width - 185, y: 20, sx: 2.1, sy: 2.1 * stretchY, r: 0.12, flip: true, seed: 3.3, minG: 0.5 },
        { x: width + 10, y: 35, sx: 2.5, sy: 2.5 * stretchY, r: -0.14, flip: true, seed: 5.2, minG: 0.8 },
        { x: width - 25, y: 115, sx: 2.2, sy: 2.3 * stretchY, r: 0.09, flip: false, seed: 3.8, minG: 1.4 },
        { x: width - 85, y: 90, sx: 1.9, sy: 2.0 * stretchY, r: -0.11, flip: true, seed: 4.5, minG: 1.9 },
        { x: width - 20, y: 195, sx: 2.1, sy: 2.2 * stretchY, r: 0.07, flip: true, seed: 1.9, minG: 2.6 },
        { x: width - 255, y: -12, sx: 2.3, sy: 2.4 * stretchY, r: -0.08, flip: false, seed: 4.8, minG: 3.2 },
      ];

      for (const p of tlPots) {
        if (g < p.minG) continue;
        const fade = Math.min(1.0, (g - p.minG) / 0.4);
        const sway = Math.sin(time * 1.5 + p.seed) * 0.05 + extraSway;
        drawSprite(vineImg, p.x, p.y, p.sx * fade, p.r + sway, p.flip, fade, p.sy * fade);
      }

      for (const p of trPots) {
        if (g < p.minG) continue;
        const fade = Math.min(1.0, (g - p.minG) / 0.4);
        const sway = Math.sin(time * 1.5 + p.seed) * 0.05 + extraSway;
        drawSprite(vineImg, p.x, p.y, p.sx * fade, p.r + sway, p.flip, fade, p.sy * fade);
      }
    }

    // 2. Bottom Grass Tiles
    if (images.grassBase && images.grassBase.complete) {
      const tileWidth = 64 * 2.2;
      const tileCount = Math.ceil(width / tileWidth) + 2;
      for (let i = 0; i < tileCount; i++) {
        drawSprite(images.grassBase, i * tileWidth - 20, floorY + 12 + Math.sin(i * 1.9) * 4, 2.2, 0, i % 2 === 1);
      }
    }

    // 3. Bottom-Right Fence & Watering Can & Clovers
    if (images.fenceWatering && images.fenceWatering.complete) {
      drawSprite(images.fenceWatering, width - 130, floorY - 32, 2.4, 0, false);
      if (images.clover && images.clover.complete) {
        drawSprite(images.clover, width - 175, floorY - 8, 0.36, 0.1);
        drawSprite(images.clover, width - 68, floorY - 6, 0.32, -0.15, true);
      }
    }

    // 4. Bottom-Left Street Trash Can & Base Litter (Minimal, Crisp Scale)
    if (images.trashCan && images.trashCan.complete) {
      drawSprite(images.trashCan, 80, floorY - 38, 2.6, -0.04, false);
      if (images.crushedCan && images.crushedCan.complete) drawSprite(images.crushedCan, 32, floorY - 6, 0.95, -0.45);
      if (images.fishbone && images.fishbone.complete) drawSprite(images.fishbone, 55, floorY - 4, 0.35, 0.15);
      if (images.bananaPeel && images.bananaPeel.complete) drawSprite(images.bananaPeel, 140, floorY - 8, 0.95, 0.35, true);
      if (images.coffeecup && images.coffeecup.complete) drawSprite(images.coffeecup, 168, floorY - 6, 0.35, -0.2);
      if (images.battery && images.battery.complete) drawSprite(images.battery, 192, floorY - 6, 0.32, 0.4);
      if (images.poisonMushroom && images.poisonMushroom.complete) drawSprite(images.poisonMushroom, 218, floorY - 10, 0.9, 0.15);
    }

    // 5. Dynamic Flowers
    for (const record of flowersMap.values()) {
      const sway = Math.sin(time * 2.2 + record.x) * 0.05;
      const jiggle = record.jiggle > 0 ? Math.sin(time * 30.0) * record.jiggle : 0;
      const flowerImg = record.isGold ? images.goldenFlower : images.flowerBloom;
      drawSprite(flowerImg, record.x, record.y, record.scale, record.rotZ + sway + jiggle);
      if (record.isGold && Math.random() < 0.25) {
        spawnParticle(record.x + (Math.random() - 0.5) * 30, record.y - 10, 0, -30, '#fef08a', 3, 0.6, 'sparkle');
      }
      drawNameplate(record.owner, record.x, record.y - (26 * (record.scale / 1.25)), record.isGold);
    }

    // 6. Dynamic Falling/Stacked Trash
    for (const item of activeTrashList) {
      const img = images[item.spriteKey] || images.crushedCan;
      drawSprite(img, item.x, item.y, item.scale, item.rot);
    }

    // 6-1. Magical Potion Bottles (Glowing and Sparkly!)
    for (const p of potionsList) {
      if (images.potion && images.potion.complete) {
        const glowPulse = 0.85 + Math.sin(p.glowPhase) * 0.15;
        drawSprite(images.potion, p.x, p.y, p.scale, p.rot, false, glowPulse);
      }
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
    setSize: (w, h) => { canvas.width = w; canvas.height = h; ctx.imageSmoothingEnabled = false; },
    setPixelRatio: () => {},
    setClearColor: () => {},
  };

  return {
    scene, camera, renderer,
    syncFlowers, syncTrash, spawnPotion,
    triggerWaterEffect, triggerSunEffect, triggerCleanEffect, triggerGoldEffect, triggerLaughEffect,
    toggleNameplates, update,
  };
}



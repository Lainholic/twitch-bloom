// Pure garden and junkyard rules. Rendering and network code never own state.
export const TRASH_TYPES = ['can', 'banana', 'fishbone', 'weed'];
export const FLOWER_TYPES = ['sprout', 'rose', 'sunflower', 'golden'];

export function parseCommand(text) {
  if (typeof text !== 'string' || text.length > 500) return null;
  const match = /^!(plant|water|bloom|trash|clean)\s*$/i.exec(text.trim());
  return match ? match[1].toLowerCase() : null;
}

export function flowerTraits(owner) {
  let seed = 2166136261;
  for (const char of owner) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  return {
    hue: seed % 360,
    petals: 5 + seed % 4,
    height: 0.7 + (seed % 80) / 100,
    typeIndex: seed % FLOWER_TYPES.length
  };
}

export function createGarden({
  capacity = 150,
  trashCapacity = 80,
  cooldownMs = 3000,
  autoPlant = false
} = {}) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000 ||
      !Number.isInteger(trashCapacity) || trashCapacity < 1 || trashCapacity > 1000 ||
      !Number.isFinite(cooldownMs) || cooldownMs < 0) {
    throw new Error('Invalid garden limits');
  }

  const flowers = new Map();
  const trashItems = [];
  const seen = new Set();
  let trashSeq = 0;

  const stats = {
    totalPlanted: 0,
    totalWatered: 0,
    totalBloomed: 0,
    totalTrash: 0,
    totalCleaned: 0,
    userActions: new Map()
  };

  function trackUser(user, action, now) {
    if (!stats.userActions.has(user)) {
      stats.userActions.set(user, { user, plant: 0, water: 0, bloom: 0, trash: 0, clean: 0, total: 0, lastAction: 0 });
    }
    const rec = stats.userActions.get(user);
    if (rec[action] !== undefined) rec[action]++;
    rec.total++;
    rec.lastAction = now;
  }

  return {
    snapshot: () => {
      const list = [...flowers.values()].map(f => ({ ...f, traits: { ...f.traits } }));
      list.trash = trashItems.map(t => ({ ...t }));
      list.stats = { ...stats, activeFlowers: flowers.size, currentTrash: trashItems.length };
      return list;
    },
    getTrash: () => trashItems.map(t => ({ ...t })),
    getStats: () => ({
      totalPlanted: stats.totalPlanted,
      totalWatered: stats.totalWatered,
      totalBloomed: stats.totalBloomed,
      totalTrash: stats.totalTrash,
      totalCleaned: stats.totalCleaned,
      activeFlowers: flowers.size,
      currentTrash: trashItems.length,
      topUsers: [...stats.userActions.values()].sort((a, b) => b.total - a.total).slice(0, 5)
    }),
    apply({ user, text, id } = {}, now = Date.now()) {
      const command = parseCommand(text);
      if (!command) return { accepted: false, reason: 'ignored' };
      if (typeof user !== 'string' || !/^[a-z0-9_]{1,25}$/i.test(user) ||
          !Number.isFinite(now) || now < 0 ||
          (id !== undefined && (typeof id !== 'string' || id.length > 128))) {
        return { accepted: false, reason: 'invalid' };
      }
      if (id) {
        if (seen.has(id)) return { accepted: false, reason: 'duplicate' };
        seen.add(id);
        if (seen.size > 2048) seen.delete(seen.values().next().value);
      }
      const owner = user.toLowerCase();

      if (command === 'trash') {
        const u = stats.userActions.get(owner);
        if (u && now - u.lastAction < cooldownMs) return { accepted: false, reason: 'cooldown' };
        if (trashItems.length >= trashCapacity) trashItems.shift();
        const type = TRASH_TYPES[Math.floor(Math.random() * TRASH_TYPES.length)];
        const trash = { id: `trash_${++trashSeq}`, type, x: ((Math.random() * 13) - 6.5), rotZ: (Math.random() * 0.8) - 0.4, owner, createdAt: now };
        trashItems.push(trash);
        stats.totalTrash++;
        trackUser(owner, 'trash', now);
        return { accepted: true, command, owner, trash };
      }

      if (command === 'clean') {
        const u = stats.userActions.get(owner);
        if (u && now - u.lastAction < cooldownMs) return { accepted: false, reason: 'cooldown' };
        if (trashItems.length === 0) return { accepted: false, reason: 'no-trash' };
        const removed = trashItems.shift();
        stats.totalCleaned++;
        trackUser(owner, 'clean', now);
        return { accepted: true, command, owner, cleanedTrash: removed };
      }

      let flower = flowers.get(owner);
      if (!flower) {
        if (command === 'water' && autoPlant) {
          if (flowers.size >= capacity) return { accepted: false, reason: 'full' };
          const next = { owner, slot: flowers.size, growth: 1, blooming: false, lastAction: now, traits: flowerTraits(owner) };
          flowers.set(owner, next);
          stats.totalPlanted++;
          stats.totalWatered++;
          trackUser(owner, 'plant', now);
          trackUser(owner, 'water', now);
          return { accepted: true, command: 'water', owner, autoPlanted: true };
        }
        if (command !== 'plant') return { accepted: false, reason: 'plant-first' };
        if (flowers.size >= capacity) return { accepted: false, reason: 'full' };
        const next = { owner, slot: flowers.size, growth: 0, blooming: false, lastAction: now, traits: flowerTraits(owner) };
        flowers.set(owner, next);
        stats.totalPlanted++;
        trackUser(owner, 'plant', now);
        return { accepted: true, command, owner };
      }

      if (command === 'plant') return { accepted: false, reason: 'already-planted' };
      if (now - flower.lastAction < cooldownMs) return { accepted: false, reason: 'cooldown' };

      if (command === 'water') {
        if (flower.growth >= 3) return { accepted: false, reason: 'fully-grown' };
        flower.growth++;
        stats.totalWatered++;
        trackUser(owner, 'water', now);
      } else if (command === 'bloom') {
        if (flower.growth < 3) return { accepted: false, reason: 'water-first' };
        if (flower.blooming) return { accepted: false, reason: 'already-blooming' };
        flower.blooming = true;
        stats.totalBloomed++;
        trackUser(owner, 'bloom', now);
      }
      flower.lastAction = now;
      return { accepted: true, command, owner };
    }
  };
}

// Pure garden and junkyard rules. Rendering and network code never own state.
export const TRASH_TYPES = ['pizza', 'can', 'banana', 'fishbone', 'paper', 'mushroom'];
export const FLOWER_TYPES = ['sprout', 'rose', 'sunflower', 'wildflower', 'golden'];

export function parseCommand(text) {
  if (typeof text !== 'string' || text.length > 500) return null;
  const t = text.trim();

  // Water / Growth
  if (/^!(?:물|water)\b/i.test(t) || t.includes('💧')) {
    return 'water';
  }
  // Sunlight / Bloom
  if (/^!(?:햇빛|sun)\b/i.test(t) || t.includes('☀️')) {
    return 'sun';
  }
  // Trash
  if (/^!(?:쓰레기|trash|피자|깡통)\b/i.test(t) || t.includes('🗑️') || t.includes('🍕') || t.includes('🥫')) {
    return 'trash';
  }
  // Clean
  if (/^!(?:청소|clean)\b/i.test(t) || t.includes('🧹')) {
    return 'clean';
  }
  // Special Gold / Fertilizer
  if (/^!(?:비료|gold|황금)\b/i.test(t) || t.includes('✨') || t.includes('🌟')) {
    return 'gold';
  }
  // Laughter / Shake
  if (/(?:ㅋㅋㅋㅋ|lol|lul|lmao)/i.test(t)) {
    return 'laugh';
  }

  // Legacy fallback
  if (/^!plant\b/i.test(t)) return 'water';
  if (/^!bloom\b/i.test(t)) return 'sun';

  return null;
}

export function flowerTraits(owner) {
  let seed = 2166136261;
  for (const char of owner) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  return {
    hue: seed % 360,
    petals: 5 + (seed % 4),
    scale: 0.85 + (seed % 30) / 100,
    rot: ((seed % 90) - 45) * (Math.PI / 180),
    preferredZone: (seed % 3 === 0) ? 'bottom-left' : (seed % 3 === 1) ? 'bottom-right' : 'bottom'
  };
}

export function createGarden({
  capacity = 150,
  trashCapacity = 100,
  cooldownMs = 1500,
  autoPlant = true
} = {}) {
  const flowers = new Map();
  const trashItems = [];
  const seen = new Set();
  let trashSeq = 0;
  let flowerSeq = 0;

  const stats = {
    totalPlanted: 0,
    totalWatered: 0,
    totalSunned: 0,
    totalTrash: 0,
    totalCleaned: 0,
    totalGold: 0,
    userActions: new Map()
  };

  function trackUser(user, action, now) {
    if (!stats.userActions.has(user)) {
      stats.userActions.set(user, {
        user,
        water: 0,
        sun: 0,
        trash: 0,
        clean: 0,
        gold: 0,
        total: 0,
        lastAction: 0
      });
    }
    const rec = stats.userActions.get(user);
    if (rec[action] !== undefined) rec[action]++;
    rec.total++;
    rec.lastAction = now;
  }

  function getMVPs() {
    const users = [...stats.userActions.values()];
    const gardeners = [...users].sort((a, b) => {
      const scoreA = a.water + a.sun + a.clean * 1.5 + a.gold * 2;
      const scoreB = b.water + b.sun + b.clean * 1.5 + b.gold * 2;
      return scoreB - scoreA;
    });
    const trolls = [...users].sort((a, b) => b.trash - a.trash);

    return {
      topGardener: gardeners[0]?.user || '정원 꿈나무',
      topTroll: (trolls[0]?.trash > 0) ? trolls[0].user : '착한 시청자단'
    };
  }

  return {
    snapshot: () => {
      const list = [...flowers.values()].map(f => ({ ...f, traits: { ...f.traits } }));
      list.trash = trashItems.map(t => ({ ...t }));
      list.stats = {
        ...stats,
        activeFlowers: flowers.size,
        currentTrash: trashItems.length
      };
      return list;
    },
    getFlowers: () => [...flowers.values()].map(f => ({ ...f })),
    getTrash: () => trashItems.map(t => ({ ...t })),
    getStats: () => {
      const mvps = getMVPs();
      return {
        totalPlanted: stats.totalPlanted,
        totalWatered: stats.totalWatered,
        totalSunned: stats.totalSunned,
        totalTrash: stats.totalTrash,
        totalCleaned: stats.totalCleaned,
        totalGold: stats.totalGold,
        activeFlowers: flowers.size,
        currentTrash: trashItems.length,
        topGardener: mvps.topGardener,
        topTroll: mvps.topTroll,
        topUsers: [...stats.userActions.values()].sort((a, b) => b.total - a.total).slice(0, 5)
      };
    },
    apply({ user, text, id } = {}, now = Date.now()) {
      const command = parseCommand(text);
      if (!command) return { accepted: false, reason: 'ignored' };
      if (typeof user !== 'string' || !/^[a-z0-9_]{1,30}$/i.test(user) ||
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

      // Laugh reaction (no cooldown, just visual/audio bounce)
      if (command === 'laugh') {
        return { accepted: true, command: 'laugh', owner };
      }

      // Check cooldown
      const u = stats.userActions.get(owner);
      if (u && now - u.lastAction < cooldownMs) {
        return { accepted: false, reason: 'cooldown' };
      }

      // 1. Trash command
      if (command === 'trash') {
        if (trashItems.length >= trashCapacity) trashItems.shift();
        const type = TRASH_TYPES[Math.floor(Math.random() * TRASH_TYPES.length)];
        // Spread evenly across the entire bottom floor line (no corner clustering!)
        const targetX = -0.88 + Math.random() * 1.76;

        const trash = {
          id: `trash_${++trashSeq}`,
          type,
          x: targetX,
          rotZ: (Math.random() * 90 - 45) * (Math.PI / 180),
          scale: 0.85 + Math.random() * 0.35,
          owner,
          createdAt: now
        };
        trashItems.push(trash);
        stats.totalTrash++;
        trackUser(owner, 'trash', now);
        return { accepted: true, command, owner, trash };
      }

      // 2. Clean command
      if (command === 'clean') {
        if (trashItems.length === 0) {
          return { accepted: true, command, owner, cleanedCount: 0 };
        }
        const cleanCount = Math.min(trashItems.length, 2 + Math.floor(Math.random() * 3));
        const removed = [];
        for (let i = 0; i < cleanCount; i++) {
          if (trashItems.length > 0) {
            removed.push(trashItems.shift());
          }
        }
        stats.totalCleaned += removed.length;
        trackUser(owner, 'clean', now);
        return { accepted: true, command, owner, removed, cleanedCount: removed.length };
      }

      // 3. Gold / Special command
      if (command === 'gold') {
        let flower = flowers.get(owner);
        if (!flower) {
          if (flowers.size >= capacity) {
            const oldestKey = flowers.keys().next().value;
            flowers.delete(oldestKey);
          }
          flower = {
            id: `flower_${++flowerSeq}`,
            owner,
            growth: 3,
            blooming: true,
            isGold: true,
            traits: flowerTraits(owner),
            lastUpdated: now
          };
          flowers.set(owner, flower);
          stats.totalPlanted++;
        } else {
          flower.growth = 3;
          flower.blooming = true;
          flower.isGold = true;
          flower.lastUpdated = now;
        }
        stats.totalGold++;
        trackUser(owner, 'gold', now);
        return { accepted: true, command: 'gold', owner, flower };
      }

      // 4. Water / Growth command
      if (command === 'water') {
        let flower = flowers.get(owner);
        let isNew = false;
        if (!flower) {
          if (flowers.size >= capacity) {
            const oldestKey = flowers.keys().next().value;
            flowers.delete(oldestKey);
          }
          flower = {
            id: `flower_${++flowerSeq}`,
            owner,
            growth: 0,
            blooming: false,
            traits: flowerTraits(owner),
            lastUpdated: now
          };
          flowers.set(owner, flower);
          stats.totalPlanted++;
          isNew = true;
        } else {
          flower.growth = Math.min(3, flower.growth + 1);
          if (flower.growth >= 2) flower.blooming = true;
          flower.lastUpdated = now;
        }
        stats.totalWatered++;
        trackUser(owner, 'water', now);
        return { accepted: true, command, owner, flower, isNew };
      }

      // 5. Sun / Bloom command
      if (command === 'sun') {
        let flower = flowers.get(owner);
        let isNew = false;
        if (!flower) {
          if (flowers.size >= capacity) {
            const oldestKey = flowers.keys().next().value;
            flowers.delete(oldestKey);
          }
          flower = {
            id: `flower_${++flowerSeq}`,
            owner,
            growth: 1,
            blooming: true,
            traits: flowerTraits(owner),
            lastUpdated: now
          };
          flowers.set(owner, flower);
          stats.totalPlanted++;
          isNew = true;
        } else {
          flower.growth = Math.min(3, Math.max(1, flower.growth + 1));
          flower.blooming = true;
          flower.lastUpdated = now;
        }
        stats.totalSunned++;
        trackUser(owner, 'sun', now);
        return { accepted: true, command, owner, flower, isNew };
      }

      return { accepted: false, reason: 'unknown' };
    }
  };
}


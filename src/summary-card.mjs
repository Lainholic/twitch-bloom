import * as THREE from '../vendor/three.module.js';

export function createSummaryCard({ onDownloadComplete = () => {} } = {}) {
  const group = new THREE.Group();
  group.visible = false;

  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 960;
  cardCanvas.height = 1280;
  const ctx = cardCanvas.getContext('2d');

  const texture = new THREE.CanvasTexture(cardCanvas);
  const cardGeo = new THREE.BoxGeometry(2.4, 3.2, 0.06);
  const cardMatFront = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.15 });
  const cardMatBack = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.5 });
  const cardMatEdge = new THREE.MeshStandardMaterial({ color: 0x384565, roughness: 0.2, metalness: 0.6 });

  const cardMesh = new THREE.Mesh(cardGeo, [cardMatEdge, cardMatEdge, cardMatEdge, cardMatEdge, cardMatFront, cardMatBack]);
  cardMesh.position.y = -0.7; // Align with camera center view
  group.add(cardMesh);

  let isShowing = false;
  let animProgress = 0;

  function drawCard(rawStats) {
    const stats = rawStats || {};
    ctx.clearRect(0, 0, 960, 1280);
    const bg = ctx.createLinearGradient(0, 0, 0, 1280);
    bg.addColorStop(0, '#0f172a'); bg.addColorStop(0.5, '#1e293b'); bg.addColorStop(1, '#090d16');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(20, 20, 920, 1240, 36); ctx.fill();

    const border = ctx.createLinearGradient(0, 0, 960, 1280);
    border.addColorStop(0, '#38bdf8'); border.addColorStop(0.5, '#f472b6'); border.addColorStop(1, '#fbbf24');
    ctx.strokeStyle = border; ctx.lineWidth = 6; ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(34, 34, 892, 1212, 24); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText('TWITCH BLOOM & JUNKYARD', 480, 85);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 52px sans-serif';
    ctx.fillText('DAILY STREAM RECAP', 480, 150);

    // Dynamic Title based on Flower vs Trash ratio
    const activeFlowers = stats.activeFlowers || 0;
    const currentTrash = stats.currentTrash || 0;
    const totalItems = activeFlowers + currentTrash;
    let rankTitle = '🌿 Wildflower Meadow by the Junkyard';
    let titleColor = '#4ade80';

    if (totalItems > 0) {
      const flowerRatio = activeFlowers / totalItems;
      if (flowerRatio >= 0.8) {
        rankTitle = '🌺 Enchanted Pristine Fairy Garden';
        titleColor = '#f472b6';
      } else if (flowerRatio <= 0.2) {
        rankTitle = '🗑️ Chaotic Junkyard of Pizza & Trash';
        titleColor = '#fb923c';
      }
    }

    // Title badge
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(100, 180, 760, 56, 28); ctx.fill();
    ctx.strokeStyle = titleColor; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = titleColor; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(rankTitle, 480, 218);

    // Stats Grid 4 Boxes
    const boxes = [
      { label: 'Active Flowers', val: `${activeFlowers} blooms`, icon: '🌸', col: '#f472b6' },
      { label: 'Trash Dumped', val: `${stats.totalTrash || 0} items`, icon: '🥫', col: '#fb923c' },
      { label: 'Water & Sun', val: `${(stats.totalWatered || 0) + (stats.totalSunned || 0)} times`, icon: '💧', col: '#38bdf8' },
      { label: 'Trash Cleaned', val: `${stats.totalCleaned || 0} items`, icon: '✨', col: '#4ade80' }
    ];
    boxes.forEach((b, i) => {
      const bx = 80 + (i % 2) * 410, by = 260 + Math.floor(i / 2) * 155;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath(); ctx.roundRect(bx, by, 390, 135, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = '30px sans-serif'; ctx.fillText(b.icon, bx + 20, by + 50);
      ctx.fillStyle = '#94a3b8'; ctx.font = '600 22px sans-serif';
      ctx.fillText(b.label, bx + 64, by + 48);
      ctx.fillStyle = b.col; ctx.font = 'bold 38px sans-serif';
      ctx.fillText(b.val, bx + 22, by + 104);
    });

    // MVP Dual Spotlight
    const mvpTopY = 590;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath(); ctx.roundRect(80, mvpTopY, 800, 120, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; ctx.lineWidth = 2; ctx.stroke();

    // Top Gardener
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('👑 TOP GARDENER MVP', 110, mvpTopY + 42);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText(stats.topGardener || 'Kind Chatters', 110, mvpTopY + 84);

    // Top Troll
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fb923c'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText('🍕 TOP TROLL MVP', 850, mvpTopY + 42);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText(stats.topTroll || 'Peaceful Chatters', 850, mvpTopY + 84);

    // Contribution Ranking Table
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath(); ctx.roundRect(80, 730, 800, 430, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('🏆 CHATTER LEADERBOARD 🏆', 480, 775);

    const users = stats.topUsers || [];
    if (users.length === 0) {
      ctx.fillStyle = '#64748b'; ctx.font = '24px sans-serif';
      ctx.fillText('No chatter activity recorded yet.', 480, 930);
    } else {
      users.slice(0, 5).forEach((u, i) => {
        const ry = 830 + i * 58;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ` ${i + 1}.`;
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? '#fbbf24' : '#e2e8f0'; ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`${medal} ${u.user}`, 110, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8'; ctx.font = '20px sans-serif';
        ctx.fillText(`Nurtured: ${((u.water || 0) + (u.sun || 0) + (u.clean || 0))} / Trash: ${u.trash || 0}`, 850, ry);
      });
    }

    // Footer with Session ID
    ctx.fillStyle = '#64748b'; ctx.font = '500 19px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Codex Session ID: 01a17ae2-0503-7173-ace9-d83891dec75a', 480, 1195);
    ctx.fillStyle = '#475569'; ctx.font = '500 17px sans-serif';
    ctx.fillText('OpenAI Codex x TwitchCon Hackathon • Twitch Bloom & Junkyard', 480, 1225);

    texture.needsUpdate = true;
  }


  return {
    group,
    show: (stats) => {
      drawCard(stats);
      group.visible = true;
      group.scale.set(0.1, 0.1, 0.1);
      group.rotation.set(0, -Math.PI * 2, 0);
      isShowing = true;
      animProgress = 0;
    },
    hide: () => {
      isShowing = false;
      group.visible = false;
    },
    isVisible: () => group.visible,
    update: (delta) => {
      if (!isShowing) return;
      if (animProgress < 1) {
        animProgress = Math.min(1, animProgress + delta * 1.5);
        const t = animProgress;
        const eased = 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
        const s = Math.max(0.01, eased);
        group.scale.set(s, s, s);
        group.rotation.y = (-Math.PI * 2) * (1 - animProgress);
        group.position.z = 1.0 * animProgress;
      } else {
        const time = performance.now() * 0.0015;
        group.rotation.y = Math.sin(time) * 0.06;
        group.rotation.x = Math.cos(time * 0.8) * 0.03;
      }
    },
    downloadPNG: (filename = 'twitch-bloom-summary.png') => {
      return new Promise((resolve) => {
        cardCanvas.toBlob((blob) => {
          if (!blob) { resolve(false); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onDownloadComplete();
            resolve(true);
          }, 100);
        }, 'image/png');
      });
    },
    getCanvas: () => cardCanvas
  };
}

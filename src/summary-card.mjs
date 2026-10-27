import * as THREE from '../vendor/three.module.js';

export function createSummaryCard({ onDownloadComplete = () => {} } = {}) {
  const group = new THREE.Group();
  group.visible = false;

  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 960;
  cardCanvas.height = 1280;
  const ctx = cardCanvas.getContext('2d');

  const texture = new THREE.CanvasTexture(cardCanvas);
  const cardGeo = new THREE.BoxGeometry(4.0, 5.33, 0.08);
  const cardMatFront = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.15 });
  const cardMatBack = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.5 });
  const cardMatEdge = new THREE.MeshStandardMaterial({ color: 0x384565, roughness: 0.2, metalness: 0.6 });

  const cardMesh = new THREE.Mesh(cardGeo, [cardMatEdge, cardMatEdge, cardMatEdge, cardMatEdge, cardMatFront, cardMatBack]);
  group.add(cardMesh);

  let isShowing = false;
  let animProgress = 0;

  function drawCard(stats) {
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
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText('TWITCH BLOOM & JUNKYARD', 480, 100);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 56px sans-serif';
    ctx.fillText('오늘의 방송 결산 카드', 480, 175);
    const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    ctx.fillStyle = '#94a3b8'; ctx.font = '500 24px sans-serif';
    ctx.fillText(dateStr, 480, 225);

    const boxes = [
      { label: '활성 꽃', val: `${stats.activeFlowers || 0} 송이`, icon: '🌸', col: '#f472b6' },
      { label: '물주기', val: `${stats.totalWatered || 0} 회`, icon: '💧', col: '#38bdf8' },
      { label: '투척 쓰레기', val: `${stats.totalTrash || 0} 개`, icon: '🥫', col: '#fb923c' },
      { label: '청소된 쓰레기', val: `${stats.totalCleaned || 0} 개`, icon: '✨', col: '#4ade80' }
    ];
    boxes.forEach((b, i) => {
      const bx = 80 + (i % 2) * 410, by = 280 + Math.floor(i / 2) * 175;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath(); ctx.roundRect(bx, by, 390, 150, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = '32px sans-serif'; ctx.fillText(b.icon, bx + 22, by + 56);
      ctx.fillStyle = '#94a3b8'; ctx.font = '600 24px sans-serif';
      ctx.fillText(b.label, bx + 70, by + 52);
      ctx.fillStyle = b.col; ctx.font = 'bold 42px sans-serif';
      ctx.fillText(b.val, bx + 24, by + 115);
    });

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath(); ctx.roundRect(80, 660, 800, 490, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('🏆 가든 & 정크야드 기여 랭킹 🏆', 480, 715);

    const users = stats.topUsers || [];
    if (users.length === 0) {
      ctx.fillStyle = '#64748b'; ctx.font = '28px sans-serif';
      ctx.fillText('아직 참여한 시청자가 없습니다.', 480, 910);
    } else {
      users.slice(0, 5).forEach((u, i) => {
        const ry = 780 + i * 65;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ` ${i + 1}.`;
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? '#fbbf24' : '#e2e8f0'; ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${medal} ${u.user}`, 110, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8'; ctx.font = '22px sans-serif';
        ctx.fillText(`물 ${u.water || 0} / 청소 ${u.clean || 0} / 쓰레기 ${u.trash || 0} (총 ${u.total}회)`, 850, ry);
      });
    }
    ctx.fillStyle = '#475569'; ctx.font = '500 22px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('Twitch Bloom & Junkyard • Open Source Interactive Overlay', 480, 1205);
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
        group.position.z = 1.2 * animProgress;
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

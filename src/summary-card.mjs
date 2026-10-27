// ============================================================================
// Twitch Bloom & Junkyard - End-of-Stream Daily Recap Card Modal
// High-Resolution 2D Pixel Canvas & Responsive DOM Overlay System
// ============================================================================

export function createSummaryCard({ onDownloadComplete = () => {}, onClose = () => {} } = {}) {
  const isBrowser = typeof document !== 'undefined';
  const cardCanvas = isBrowser
    ? document.createElement('canvas')
    : {
        width: 960,
        height: 1280,
        getContext: () => ({
          clearRect: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          beginPath: () => {},
          roundRect: () => {},
          fill: () => {},
          stroke: () => {},
          fillText: () => {}
        }),
        toBlob: (cb) => { cb(null); }
      };

  cardCanvas.width = 960;
  cardCanvas.height = 1280;
  const ctx = cardCanvas.getContext('2d');

  let isShowing = false;
  let overlayEl = null;

  // Initialize DOM Overlay Modal in browser environment
  if (isBrowser) {
    overlayEl = document.createElement('div');
    overlayEl.id = 'summary-card-overlay';
    overlayEl.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 250;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(6, 9, 18, 0.82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 16px;
      user-select: none;
      opacity: 0;
      transition: opacity 0.22s ease-out;
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      max-width: 95vw;
      max-height: 96vh;
      transform: scale(0.92) translateY(12px);
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    // High-Resolution responsive card canvas preview
    cardCanvas.style.cssText = `
      max-width: min(88vw, 460px);
      max-height: min(78vh, 613px);
      width: auto;
      height: auto;
      aspect-ratio: 960 / 1280;
      object-fit: contain;
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: block;
      background: #090d16;
    `;
    wrapper.appendChild(cardCanvas);

    // Bottom Action Toolbar (Save PNG & Close)
    const actionRow = document.createElement('div');
    actionRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 4px;
    `;

    const btnSave = document.createElement('button');
    btnSave.textContent = '💾 Save High-Res PNG';
    btnSave.style.cssText = `
      background: #059669;
      color: #fff;
      border: 1px solid #34d399;
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      transition: all 0.15s ease;
    `;
    btnSave.addEventListener('mouseenter', () => { btnSave.style.background = '#10b981'; btnSave.style.transform = 'translateY(-1px)'; });
    btnSave.addEventListener('mouseleave', () => { btnSave.style.background = '#059669'; btnSave.style.transform = 'none'; });
    btnSave.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadPNG('twitch-bloom-summary.png');
    });

    const btnCloseModal = document.createElement('button');
    btnCloseModal.textContent = '✖ Close';
    btnCloseModal.style.cssText = `
      background: rgba(30, 41, 59, 0.85);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    `;
    btnCloseModal.addEventListener('mouseenter', () => { btnCloseModal.style.background = '#334155'; btnCloseModal.style.color = '#fff'; });
    btnCloseModal.addEventListener('mouseleave', () => { btnCloseModal.style.background = 'rgba(30, 41, 59, 0.85)'; btnCloseModal.style.color = '#cbd5e1'; });
    btnCloseModal.addEventListener('click', (e) => {
      e.stopPropagation();
      hideCard();
    });

    actionRow.appendChild(btnSave);
    actionRow.appendChild(btnCloseModal);
    wrapper.appendChild(actionRow);

    // Top-Right Floating X Button
    const btnFloatClose = document.createElement('button');
    btnFloatClose.innerHTML = '&times;';
    btnFloatClose.style.cssText = `
      position: absolute;
      top: -12px;
      right: -12px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #fff;
      color: #fff;
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transition: transform 0.15s ease;
    `;
    btnFloatClose.addEventListener('mouseenter', () => { btnFloatClose.style.transform = 'scale(1.15)'; });
    btnFloatClose.addEventListener('mouseleave', () => { btnFloatClose.style.transform = 'scale(1.0)'; });
    btnFloatClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideCard();
    });
    wrapper.appendChild(btnFloatClose);

    overlayEl.appendChild(wrapper);

    // Close on background click
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) hideCard();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isShowing) hideCard();
    });

    document.body.appendChild(overlayEl);
  }

  function drawCard(rawStats) {
    const stats = rawStats || {};
    ctx.clearRect(0, 0, 960, 1280);

    // Deep cosmic gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, 1280);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e293b');
    bg.addColorStop(1, '#090d16');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(20, 20, 920, 1240, 36);
    ctx.fill();

    // Vibrant border stroke
    const border = ctx.createLinearGradient(0, 0, 960, 1280);
    border.addColorStop(0, '#38bdf8');
    border.addColorStop(0.5, '#f472b6');
    border.addColorStop(1, '#fbbf24');
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(34, 34, 892, 1212, 24);
    ctx.stroke();

    // Title Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('TWITCH BLOOM & JUNKYARD', 480, 85);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 52px sans-serif';
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(100, 180, 760, 56, 28);
    ctx.fill();
    ctx.strokeStyle = titleColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(rankTitle, 480, 218);

    // Stats Grid 4 Boxes
    const boxes = [
      { label: 'Active Flowers', val: `${activeFlowers} blooms`, icon: '🌸', col: '#f472b6' },
      { label: 'Trash Dumped', val: `${stats.totalTrash || 0} items`, icon: '🥫', col: '#fb923c' },
      { label: 'Water & Sun', val: `${(stats.totalWatered || 0) + (stats.totalSunned || 0)} times`, icon: '💧', col: '#38bdf8' },
      { label: 'Trash Cleaned', val: `${stats.totalCleaned || 0} items`, icon: '✨', col: '#4ade80' }
    ];

    boxes.forEach((b, i) => {
      const bx = 80 + (i % 2) * 410;
      const by = 260 + Math.floor(i / 2) * 155;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(bx, by, 390, 135, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '30px sans-serif';
      ctx.fillText(b.icon, bx + 20, by + 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px sans-serif';
      ctx.fillText(b.label, bx + 64, by + 48);
      ctx.fillStyle = b.col;
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(b.val, bx + 22, by + 104);
    });

    // MVP Dual Spotlight
    const mvpTopY = 590;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(80, mvpTopY, 800, 120, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Gardener
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('👑 TOP GARDENER MVP', 110, mvpTopY + 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(stats.topGardener || 'Kind Chatters', 110, mvpTopY + 84);

    // Top Troll
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('🍕 TOP TROLL MVP', 850, mvpTopY + 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(stats.topTroll || 'Peaceful Chatters', 850, mvpTopY + 84);

    // Contribution Ranking Table
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(80, 730, 800, 430, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 CHATTER LEADERBOARD 🏆', 480, 775);

    const users = stats.topUsers || [];
    if (users.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '24px sans-serif';
      ctx.fillText('No chatter activity recorded yet.', 480, 930);
    } else {
      users.slice(0, 5).forEach((u, i) => {
        const ry = 830 + i * 58;
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ` ${i + 1}.`;
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? '#fbbf24' : '#e2e8f0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`${medal} ${u.user}`, 110, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.fillText(`Nurtured: ${((u.water || 0) + (u.sun || 0) + (u.clean || 0))} / Trash: ${u.trash || 0}`, 850, ry);
      });
    }

    // Footer with Session ID
    ctx.fillStyle = '#64748b';
    ctx.font = '500 19px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Codex Session ID: 01a17ae2-0503-7173-ace9-d83891dec75a', 480, 1195);
    ctx.fillStyle = '#475569';
    ctx.font = '500 17px sans-serif';
    ctx.fillText('OpenAI Codex x TwitchCon Hackathon • Twitch Bloom & Junkyard', 480, 1225);
  }

  function showCard(stats) {
    drawCard(stats);
    isShowing = true;
    if (overlayEl) {
      overlayEl.style.display = 'flex';
      // Trigger smooth CSS fade & pop animation
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          overlayEl.style.opacity = '1';
          const wrapper = overlayEl.firstElementChild;
          if (wrapper) wrapper.style.transform = 'scale(1) translateY(0)';
        });
      } else {
        overlayEl.style.opacity = '1';
      }
    }
  }

  function hideCard() {
    if (!isShowing) return;
    isShowing = false;
    if (overlayEl) {
      overlayEl.style.opacity = '0';
      const wrapper = overlayEl.firstElementChild;
      if (wrapper) wrapper.style.transform = 'scale(0.92) translateY(12px)';
      setTimeout(() => {
        if (!isShowing) overlayEl.style.display = 'none';
      }, 200);
    }
    onClose();
  }

  function downloadPNG(filename = 'twitch-bloom-summary.png') {
    return new Promise((resolve) => {
      if (!isBrowser || typeof cardCanvas.toBlob !== 'function') {
        resolve(false);
        return;
      }
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
  }

  // Backward compatibility dummy group for scene.add(summaryCard.group)
  const group = {
    visible: false,
    add: () => {},
    remove: () => {},
    scale: { set: () => {} },
    rotation: { set: () => {}, x: 0, y: 0, z: 0 },
    position: { set: () => {}, x: 0, y: 0, z: 0 }
  };

  return {
    group,
    show: showCard,
    hide: hideCard,
    isVisible: () => isShowing,
    update: () => {},
    downloadPNG,
    getCanvas: () => cardCanvas
  };
}

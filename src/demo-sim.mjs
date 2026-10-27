// Procedural crowd simulation for live demonstration & video recording
export function createDemoSimulation({ handleEvent, summaryCard, getStats = () => ({}), onStep = () => {} }) {
  let isRunning = false;
  let timerId = null;
  let currentStep = 0;

  // Rich stream scenario steps (timeline in milliseconds relative to step start)
  const script = [
    // Phase 1: Sprouts sprouting from water & sun
    { delay: 300,  user: 'green_thumb',  text: '!물', desc: '새싹 발아' },
    { delay: 800,  user: 'sun_chaser',   text: '!햇빛', desc: '장미 개화' },
    { delay: 1400, user: 'petal_lover',  text: '!water', desc: '새싹 발아' },
    { delay: 2000, user: 'bloom_fairy',  text: '!sun', desc: '들꽃 개화' },

    // Phase 2: Growth into Roses & Sunflowers
    { delay: 2800, user: 'green_thumb',  text: '!water', desc: '장미 성장' },
    { delay: 3400, user: 'sun_chaser',   text: '!sun', desc: '해바라기 성장' },

    // Phase 3: Playful viewers throwing trash
    { delay: 4200, user: 'trash_goblin', text: '!피자', desc: '🍕 피자 투척' },
    { delay: 4700, user: 'troll_king',    text: '!깡통', desc: '🥫 찌그러진 캔 투척' },
    { delay: 5300, user: 'snack_bandit', text: '!trash', desc: '🍌 바나나 껍질 투척' },
    { delay: 5900, user: 'pizza_guy',    text: '!쓰레기', desc: '🐟 생선 가시 투척' },

    // Phase 4: Viewers laughing and bouncing items
    { delay: 6600, user: 'chat_lurker',  text: 'ㅋㅋㅋㅋㅋㅋ', desc: '😂 웃음 반응 (오브젝트 들썩임)' },

    // Phase 5: Eco viewers cleaning the junkyard
    { delay: 7500, user: 'eco_warrior',  text: '!청소', desc: '🧹 1차 대청소' },
    { delay: 8400, user: 'clean_freak',  text: '!clean', desc: '🧹 2차 대청소' },

    // Phase 6: Deep bloom into Golden Flowers
    { delay: 9400,  user: 'petal_lover',  text: '!water', desc: '해바라기 성장' },
    { delay: 10200, user: 'bloom_fairy',  text: '!sun', desc: '야생화 대만개' },
    { delay: 11000, user: 'gold_vip',     text: '!비료', desc: '✨ 황금꽃 개화 & 반딧불이' },
    { delay: 11800, user: 'sun_chaser',   text: '!gold', desc: '✨ 황금꽃 대만개' },

    // Phase 7: Final humorous trash & immediate cleanup
    { delay: 12600, user: 'troll_king',   text: '!trash', desc: '마지막 장난 투척' },
    { delay: 13200, user: 'eco_warrior',  text: '!청소', desc: '마지막 정화' },
    { delay: 14000, user: 'chat_lurker',  text: 'lol', desc: '😂 방송 마무리 웃음' },

    // Phase 8: Broadcast Recap 3D Card
    { delay: 15200, action: 'show_card',  desc: '🏆 방송 종료 결산 카드 회전 등장' }
  ];

  function runNext() {
    if (!isRunning || currentStep >= script.length) {
      isRunning = false;
      onStep({ finished: true, currentStep, total: script.length });
      return;
    }

    const step = script[currentStep];
    const prevDelay = currentStep === 0 ? 0 : script[currentStep - 1].delay;
    const waitTime = Math.max(100, step.delay - prevDelay);

    timerId = setTimeout(() => {
      if (!isRunning) return;

      if (step.action === 'show_card') {
        if (summaryCard && !summaryCard.isVisible()) {
          summaryCard.show(getStats());
        }
      } else {
        handleEvent({ user: step.user, text: step.text });
      }

      onStep({ finished: false, currentStep, total: script.length, step });
      currentStep++;
      runNext();
    }, waitTime);
  }

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      currentStep = 0;
      onStep({ starting: true, total: script.length });
      runNext();
    },
    stop: () => {
      isRunning = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      onStep({ stopped: true });
    },
    isRunning: () => isRunning
  };
}


// Procedural crowd simulation for live demonstration & video recording
export function createDemoSimulation({ handleEvent, summaryCard, getStats = () => ({}), onStep = () => {} }) {
  let isRunning = false;
  let timerId = null;
  let currentStep = 0;

  // Realistic stream scenario steps (timeline in milliseconds relative to step start)
  const script = [
    // Phase 1: Sprouts sprouting
    { delay: 300,  user: 'green_thumb',  text: '!water', desc: '새싹 발아' },
    { delay: 900,  user: 'sun_chaser',   text: '!water', desc: '새싹 발아' },
    { delay: 1500, user: 'petal_lover',  text: '!water', desc: '새싹 발아' },
    { delay: 2100, user: 'bloom_fairy',  text: '!water', desc: '새싹 발아' },

    // Phase 2: Growth into Roses & Sunflowers
    { delay: 3200, user: 'green_thumb',  text: '!water', desc: '장미 개화' },
    { delay: 3800, user: 'sun_chaser',   text: '!water', desc: '장미 개화' },

    // Phase 3: Playful viewers throwing trash
    { delay: 4800, user: 'trash_goblin', text: '!trash', desc: '깡통 투척' },
    { delay: 5400, user: 'troll_king',    text: '!trash', desc: '바나나 투척' },
    { delay: 6000, user: 'snack_bandit', text: '!trash', desc: '생선가시 투척' },

    // Phase 4: Eco viewers cleaning the junkyard
    { delay: 7200, user: 'eco_warrior',  text: '!clean', desc: '쓰레기 청소' },
    { delay: 8100, user: 'clean_freak',  text: '!clean', desc: '쓰레기 청소' },

    // Phase 5: Deep bloom into Golden Flowers
    { delay: 9200,  user: 'petal_lover',  text: '!water', desc: '해바라기 성장' },
    { delay: 10400, user: 'bloom_fairy',  text: '!water', desc: '해바라기 성장' },
    { delay: 11600, user: 'green_thumb',  text: '!water', desc: '황금꽃 대만개' },
    { delay: 12500, user: 'sun_chaser',   text: '!water', desc: '황금꽃 대만개' },

    // Phase 6: Final cleanup & recap card
    { delay: 13500, user: 'eco_warrior',  text: '!clean', desc: '마지막 청소' },
    { delay: 15000, action: 'show_card',  desc: '3D 결산 카드 회전 등장' }
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

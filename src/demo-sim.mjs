// Procedural crowd simulation for live demonstration & video recording
export function createDemoSimulation({ handleEvent, summaryCard, getStats = () => ({}), onStep = () => {} }) {
  let isRunning = false;
  let timerId = null;
  let currentStep = 0;

  // Rich stream scenario steps (timeline in milliseconds relative to step start)
  const script = [
    // Phase 1: Sprouts sprouting from water & sun
    { delay: 300,  user: 'green_thumb',   text: '!water',  desc: 'Sprout germination' },
    { delay: 700,  user: 'sun_chaser',    text: '!sun',    desc: 'Rose blooming' },
    { delay: 1100, user: 'petal_lover',   text: '!water',  desc: 'Sprout germination' },
    { delay: 1500, user: 'bloom_fairy',   text: '!sun',    desc: 'Wildflower blooming' },

    // Phase 2: Growth into Roses & Sunflowers
    { delay: 2000, user: 'green_thumb',   text: '!water',  desc: 'Rose growth' },
    { delay: 2400, user: 'sun_chaser',    text: '!sun',    desc: 'Sunflower growth' },
    { delay: 2800, user: 'gold_vip',      text: '!potion', desc: '🧪 Potion dropped' },

    // Phase 3: Playful viewers throwing trash
    { delay: 3300, user: 'trash_goblin',  text: '!trash',  desc: '🍕 Pizza tossed' },
    { delay: 3700, user: 'troll_king',    text: '!trash',  desc: '🥫 Crushed can tossed' },
    { delay: 4100, user: 'snack_bandit',  text: '!trash',  desc: '🍌 Banana peel tossed' },
    { delay: 4500, user: 'pizza_guy',     text: '!trash',  desc: '🐟 Fishbone tossed' },
    { delay: 4900, user: 'battery_fan',   text: '!trash',  desc: '🔋 Battery tossed' },
    { delay: 5300, user: 'coffee_addict', text: '!trash',  desc: '☕ Paper cup tossed' },
    { delay: 5700, user: 'junk_rat',      text: '!trash',  desc: '🥫 Second can tossed' },
    { delay: 6100, user: 'apple_kid',     text: '!trash',  desc: '🍎 Apple core tossed' },

    // Phase 4: Viewers laughing and bouncing items
    { delay: 6700, user: 'chat_lurker',   text: 'LUL',     desc: '😂 Viewers laughing (bouncing items)' },

    // Phase 5: Eco viewers cleaning slightly (cleans only a few, trash stays accumulated!)
    { delay: 7400, user: 'eco_warrior',   text: '!clean',  desc: '🧹 Eco partial clean' },

    // Phase 6: More viewers dropping trash & building piles!
    { delay: 8000, user: 'troll_king',    text: '!trash',  desc: '🍕 Pizza stacking' },
    { delay: 8400, user: 'trash_goblin',  text: '!trash',  desc: '🥫 Can stacking' },
    { delay: 8800, user: 'snack_bandit',  text: '!trash',  desc: '🍌 Banana tossed' },
    { delay: 9200, user: 'pizza_guy',     text: '!trash',  desc: '🐟 Fishbone stacking' },
    { delay: 9600, user: 'battery_fan',   text: '!trash',  desc: '🔋 Battery stacking' },
    { delay: 10000, user: 'junk_rat',     text: '!trash',  desc: '🥫 Junkyard pile forming' },

    // Phase 7: Gardeners bloom flowers alongside junkyard
    { delay: 10600, user: 'petal_lover',  text: '!water',  desc: 'Sunflower growth' },
    { delay: 11100, user: 'bloom_fairy',  text: '!sun',    desc: 'Wildflowers blossoming' },
    { delay: 11600, user: 'gold_vip',     text: '!gold',   desc: '✨ Golden flower & fireflies' },
    { delay: 12100, user: 'sun_chaser',   text: '!gold',   desc: '✨ Golden flower full bloom' },

    // Phase 8: Tug-of-war continues!
    { delay: 12700, user: 'eco_warrior',  text: '!clean',  desc: '🧹 Second sweep' },
    { delay: 13200, user: 'troll_king',   text: '!trash',  desc: 'Final prank drop' },
    { delay: 13700, user: 'junk_rat',     text: '!trash',  desc: 'Final pizza stack' },
    { delay: 14200, user: 'chat_lurker',  text: 'lol',     desc: '😂 Stream wrap-up laughter' },

    // Phase 9: Broadcast Recap 3D Card
    { delay: 15400, action: 'show_card',  desc: '🏆 Stream Recap Card popup' }
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


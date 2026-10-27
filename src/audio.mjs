// Pure Web Audio API procedural sound synthesizer (Zero external audio files).
let audioCtx = null;
let masterGain = null;
let isMuted = false;
let currentVolume = 0.5;

export function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    window.__bloomAudioCtx = audioCtx;
    window.__bloomMasterGain = masterGain;
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function initAudio() {
  getAudioContext();
}

export function setVolume(vol) {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (masterGain && audioCtx && !isMuted) {
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
  }
}

export function setMuted(muted) {
  isMuted = !!muted;
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioCtx.currentTime);
  }
}

export function getMuted() { return isMuted; }
export function getVolume() { return currentVolume; }

// Water drop sound
export function playWater() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.25);
}

// Bloom chime chord
export function playBloom() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = now + i * 0.06;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);
    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(noteTime);
    osc.stop(noteTime + 0.55);
  });
}

// Trash impact sound
export function playTrash() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start(now);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
  oscGain.gain.setValueAtTime(0.3, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(oscGain);
  oscGain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.18);
}

// Clean sweep sound
export function playClean() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.25);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(2600, now + 0.2);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
}

// Summary card reveal sound
export function playCard() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.38);
}
// Sunlight / warm chime shimmer
export function playSun() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const freqs = [659.25, 830.61, 987.77, 1318.51, 1661.22];
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + idx * 0.05;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.65);
  });
}

// Special Gold fanfare
export function playGold() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  const chords = [
    { time: 0.0, freqs: [523.25, 659.25, 783.99] },
    { time: 0.12, freqs: [659.25, 783.99, 1046.5] },
    { time: 0.26, freqs: [783.99, 1046.5, 1318.51] },
    { time: 0.42, freqs: [1046.5, 1318.51, 1567.98, 2093.0] }
  ];
  chords.forEach(({ time, freqs }) => {
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + time;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  });
}

// Laugh pop bounce
export function playLaugh() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450 + i * 120, t);
    osc.frequency.exponentialRampToValueAtTime(900 + i * 80, t + 0.06);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

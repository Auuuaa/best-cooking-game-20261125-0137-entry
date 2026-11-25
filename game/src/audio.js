// Sizzle Station — synthesized sound effects through WebAudio.
// One job: every beep, chop and ding. No audio files are shipped; the sounds
// are built from oscillators at run time and the context only starts after a
// player gesture, so headless renders stay silent and error-free.

let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (context) return context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    context = null;
  }
  return context;
}

// Called from the first key or pointer gesture so the browser allows sound.
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + when;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  } catch {
    // Sound is garnish; a blocked context never breaks the game.
  }
}

export const sfx = {
  pickup() { tone(660, 0.09, 'sine', 0.16); },
  place() { tone(440, 0.08, 'sine', 0.14); },
  chop() { tone(190, 0.07, 'square', 0.12); tone(150, 0.07, 'square', 0.1, 0.09); },
  sizzle() { tone(1200, 0.25, 'sawtooth', 0.05); tone(900, 0.2, 'sawtooth', 0.04, 0.06); },
  ding() { tone(880, 0.14, 'sine', 0.18); tone(1318, 0.22, 'sine', 0.16, 0.1); },
  coin() { tone(988, 0.09, 'triangle', 0.16); tone(1319, 0.16, 'triangle', 0.14, 0.08); },
  error() { tone(160, 0.22, 'sawtooth', 0.12); },
  tick() { tone(1050, 0.05, 'sine', 0.08); },
  start() { tone(523, 0.1, 'triangle', 0.16); tone(659, 0.1, 'triangle', 0.16, 0.09); tone(784, 0.18, 'triangle', 0.16, 0.18); },
  end() { tone(392, 0.16, 'triangle', 0.16); tone(330, 0.16, 'triangle', 0.16, 0.14); tone(262, 0.3, 'triangle', 0.16, 0.28); },
};

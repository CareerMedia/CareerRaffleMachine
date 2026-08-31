/**
 * Procedural raffle sound effects via Web Audio API.
 * No external assets required. Respects mute / reduced-motion flags.
 */

type SpinNodes = {
  noise: AudioBufferSourceNode;
  noiseFilter: BiquadFilterNode;
  tone: OscillatorNode;
  toneGain: GainNode;
  masterGain: GainNode;
};

let audioContext: AudioContext | null = null;
let spinNodes: SpinNodes | null = null;
let muted = false;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function resumeAudio(): Promise<void> {
  if (muted) return;
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function setSoundMuted(value: boolean): void {
  muted = value;
  if (value) {
    stopSpinSound(0);
  }
}

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

/** Start the continuous spin bed (call once when the wheel begins moving). */
export function startSpinSound(): void {
  if (muted) return;
  const ctx = getContext();
  stopSpinSound(0);

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 420;
  noiseFilter.Q.value = 0.9;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.22;

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  const tone = ctx.createOscillator();
  tone.type = 'sine';
  tone.frequency.value = 92;

  const toneGain = ctx.createGain();
  toneGain.gain.value = 0.04;

  tone.connect(toneGain);
  toneGain.connect(masterGain);

  const now = ctx.currentTime;
  masterGain.gain.linearRampToValueAtTime(0.35, now + 0.45);

  noise.start(now);
  tone.start(now);

  spinNodes = { noise, noiseFilter, tone, toneGain, masterGain };
}

/** Map angular velocity (deg/s) to spin intensity 0–1. */
export function updateSpinIntensity(angularVelocityDegPerSec: number): void {
  if (muted || !spinNodes) return;
  const ctx = getContext();
  const t = ctx.currentTime;
  const intensity = Math.min(1, Math.max(0.08, angularVelocityDegPerSec / 720));

  spinNodes.masterGain.gain.cancelScheduledValues(t);
  spinNodes.masterGain.gain.setValueAtTime(spinNodes.masterGain.gain.value, t);
  spinNodes.masterGain.gain.linearRampToValueAtTime(0.12 + intensity * 0.38, t + 0.08);

  const filterFreq = 280 + intensity * 520;
  spinNodes.noiseFilter.frequency.cancelScheduledValues(t);
  spinNodes.noiseFilter.frequency.setValueAtTime(spinNodes.noiseFilter.frequency.value, t);
  spinNodes.noiseFilter.frequency.linearRampToValueAtTime(filterFreq, t + 0.08);

  spinNodes.tone.frequency.cancelScheduledValues(t);
  spinNodes.tone.frequency.setValueAtTime(spinNodes.tone.frequency.value, t);
  spinNodes.tone.frequency.linearRampToValueAtTime(72 + intensity * 48, t + 0.08);
}

export function stopSpinSound(fadeSec = 0.35): void {
  if (!spinNodes) return;
  const ctx = getContext();
  const t = ctx.currentTime;
  const { noise, tone, masterGain } = spinNodes;

  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(masterGain.gain.value, t);
  masterGain.gain.linearRampToValueAtTime(0, t + fadeSec);

  const stopAt = t + fadeSec + 0.05;
  try {
    noise.stop(stopAt);
    tone.stop(stopAt);
  } catch {
    /* already stopped */
  }

  spinNodes = null;
}

/** Mechanical pointer tick as a segment crosses 12 o'clock. */
export function playPointerTick(emphasis = 1): void {
  if (muted) return;
  const ctx = getContext();
  const t = ctx.currentTime;
  const vol = 0.07 + emphasis * 0.04;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(920 + emphasis * 80, t);
  osc.frequency.exponentialRampToValueAtTime(380, t + 0.025);

  const click = ctx.createOscillator();
  click.type = 'square';
  click.frequency.value = 1800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.025, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

  osc.connect(gain);
  click.connect(clickGain);
  gain.connect(ctx.destination);
  clickGain.connect(ctx.destination);

  osc.start(t);
  click.start(t);
  osc.stop(t + 0.04);
  click.stop(t + 0.02);
}

/** Final lock when the wheel stops on the winner. */
export function playFinalLock(): void {
  if (muted) return;
  const ctx = getContext();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

  const thud = ctx.createOscillator();
  thud.type = 'triangle';
  thud.frequency.setValueAtTime(140, t);
  thud.frequency.exponentialRampToValueAtTime(60, t + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.18, t);
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

  osc.connect(gain);
  thud.connect(thudGain);
  gain.connect(ctx.destination);
  thudGain.connect(ctx.destination);

  osc.start(t);
  thud.start(t);
  osc.stop(t + 0.15);
  thud.stop(t + 0.17);
}

function playChimeNote(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  options: { bright?: boolean; shimmer?: boolean } = {},
): void {
  const { bright = true, shimmer = true } = options;

  const fundamental = ctx.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.setValueAtTime(volume * 0.9, start + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  fundamental.connect(gain);
  gain.connect(ctx.destination);
  fundamental.start(start);
  fundamental.stop(start + duration + 0.05);

  if (bright) {
    const overtone = ctx.createOscillator();
    overtone.type = 'triangle';
    overtone.frequency.value = freq * 2.01;

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0, start);
    overtoneGain.gain.linearRampToValueAtTime(volume * 0.38, start + 0.008);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.75);

    overtone.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);
    overtone.start(start);
    overtone.stop(start + duration + 0.05);
  }

  if (shimmer) {
    const sparkle = ctx.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.value = freq * 3;

    const sparkleGain = ctx.createGain();
    sparkleGain.gain.setValueAtTime(0, start);
    sparkleGain.gain.linearRampToValueAtTime(volume * 0.14, start + 0.012);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, start + duration * 0.55);

    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(start);
    sparkle.stop(start + duration + 0.05);
  }
}

/** Bright ascending celebratory jingle for winner reveal. */
export function playWinnerSting(): void {
  if (muted) return;
  const ctx = getContext();
  const t = ctx.currentTime;

  // Ascending C-major fanfare: do-mi-sol-do!
  const fanfare = [
    { freq: 523.25, at: 0.0, dur: 0.16, vol: 0.17 },
    { freq: 659.25, at: 0.09, dur: 0.16, vol: 0.19 },
    { freq: 783.99, at: 0.18, dur: 0.16, vol: 0.21 },
    { freq: 1046.5, at: 0.28, dur: 0.62, vol: 0.24 },
  ];

  for (const note of fanfare) {
    playChimeNote(ctx, note.freq, t + note.at, note.dur, note.vol);
  }

  // Sparkle chimes on the held final note
  const sparkles = [
    { freq: 1318.51, at: 0.34, dur: 0.45, vol: 0.11 },
    { freq: 1567.98, at: 0.4, dur: 0.38, vol: 0.09 },
    { freq: 2093.0, at: 0.46, dur: 0.32, vol: 0.07 },
  ];

  for (const sparkle of sparkles) {
    playChimeNote(ctx, sparkle.freq, t + sparkle.at, sparkle.dur, sparkle.vol, {
      bright: true,
      shimmer: false,
    });
  }

  // Warm major-chord shimmer underneath the finale
  const chord = [523.25, 659.25, 783.99, 1046.5];
  for (const freq of chord) {
    const pad = ctx.createOscillator();
    pad.type = 'sine';
    pad.frequency.value = freq;

    const padGain = ctx.createGain();
    const start = t + 0.3;
    padGain.gain.setValueAtTime(0, start);
    padGain.gain.linearRampToValueAtTime(0.045, start + 0.04);
    padGain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

    pad.connect(padGain);
    padGain.connect(ctx.destination);
    pad.start(start);
    pad.stop(start + 0.75);
  }
}

/** Celebratory burst synchronized with confetti. */
export function playConfettiPop(): void {
  if (muted) return;
  const ctx = getContext();
  const t = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 900;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.28, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

  const pop = ctx.createOscillator();
  pop.type = 'sine';
  pop.frequency.setValueAtTime(880, t);
  pop.frequency.exponentialRampToValueAtTime(220, t + 0.1);

  const popGain = ctx.createGain();
  popGain.gain.setValueAtTime(0.12, t);
  popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  noise.connect(filter);
  filter.connect(gain);
  pop.connect(popGain);
  gain.connect(ctx.destination);
  popGain.connect(ctx.destination);

  noise.start(t);
  pop.start(t);
  noise.stop(t + 0.13);
  pop.stop(t + 0.12);
}

export function disposeAudio(): void {
  stopSpinSound(0);
  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }
}

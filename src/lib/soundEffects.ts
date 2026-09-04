import { TerminalSoundStyle } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SOUND_STYLES: Array<{
  id: TerminalSoundStyle;
  name: string;
  description: string;
  iconName?: string;
}> = [
  {
    id: 'mechanical',
    name: 'Classic Mechanical',
    description: 'Switches mécaniques tactiles avec clic net et résonance grave.',
  },
  {
    id: 'synth',
    name: 'Digital Synth',
    description: 'Bips numériques harmoniques fluides et futuristes.',
  },
  {
    id: 'arcade',
    name: 'Retro Arcade',
    description: 'Tonalités 8-bit chip rétro (ondes carrées style PC Speaker / Arcade).',
  },
];

export function playTerminalSound(style: TerminalSoundStyle | string = 'mechanical', volume: number = 0.04) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (style === 'mechanical') {
      // 1. Mechanical Clack: Quick low-frequency click + micro noise transient
      // Click Oscillator (Thump)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      
      const pitchVar = (Math.random() - 0.5) * 40;
      const baseFreq = 180 + pitchVar;
      osc.frequency.setValueAtTime(baseFreq * 2.2, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.025);

      oscGain.gain.setValueAtTime(volume * 1.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      // High click transient
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(1200 + (Math.random() * 400), now);
      clickGain.gain.setValueAtTime(volume * 0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);

    } else if (style === 'synth') {
      // 2. Digital Synth: Clean soft resonant sine tone with harmonic decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const noteFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const randomFreq = noteFreqs[Math.floor(Math.random() * noteFreqs.length)];
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomFreq, now);
      osc.frequency.exponentialRampToValueAtTime(randomFreq * 1.05, now + 0.04);

      gain.gain.setValueAtTime(volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);

    } else if (style === 'arcade') {
      // 3. Retro Arcade: 8-bit square wave chip chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const basePitches = [440, 554.37, 659.25, 880, 987.77, 1174.66];
      const startPitch = basePitches[Math.floor(Math.random() * basePitches.length)];

      osc.type = 'square';
      osc.frequency.setValueAtTime(startPitch, now);
      osc.frequency.linearRampToValueAtTime(startPitch * 0.5, now + 0.035);

      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  } catch (err) {
    // Audio contexts may be blocked by browser policy prior to user interaction
  }
}

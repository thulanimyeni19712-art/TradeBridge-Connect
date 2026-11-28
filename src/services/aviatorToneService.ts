import { CrashSignal } from '../types/aviator';

export type AviatorAlertToneId =
  | 'SONAR_PING'
  | 'VOLATILITY_SIREN'
  | 'QUANT_CHIME'
  | 'TACTICAL_PULSE';

export interface AviatorAlertToneOption {
  id: AviatorAlertToneId;
  label: string;
  description: string;
}

export const AVIATOR_ALERT_TONES: AviatorAlertToneOption[] = [
  {
    id: 'SONAR_PING',
    label: 'Sonar Ping',
    description: 'Sharp dual-harmonic radar lock',
  },
  {
    id: 'VOLATILITY_SIREN',
    label: 'Volatility Sweep',
    description: 'Ascending high-volatility breakout sweep',
  },
  {
    id: 'QUANT_CHIME',
    label: 'Quant Chime',
    description: 'Crisp 3-note crystal triad',
  },
  {
    id: 'TACTICAL_PULSE',
    label: 'Tactical Pulse',
    description: 'Rapid double-pulse execution alert',
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export async function unlockAviatorAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

export function isHighVolatilitySignal(sig: CrashSignal): {
  isHighVol: boolean;
  reason: string | null;
} {
  if (sig.predictedMultiplier >= 10.0) {
    return {
      isHighVol: true,
      reason: `Pink Moonshot Target (${sig.predictedMultiplier.toFixed(2)}x)`,
    };
  }
  if (sig.predictedMultiplier >= 5.0) {
    return {
      isHighVol: true,
      reason: `High-Multiplier Surge (${sig.predictedMultiplier.toFixed(2)}x)`,
    };
  }
  if (sig.pattern === 'PINK_WAVE' || sig.pattern === 'FIBONACCI_SURGE' || sig.pattern === 'VOLATILITY_SQUEEZE') {
    return {
      isHighVol: true,
      reason: `Volatility Pattern (${sig.pattern.replace(/_/g, ' ')})`,
    };
  }
  if (sig.phase === 'PEAK') {
    return {
      isHighVol: true,
      reason: 'Peak Volatility Phase Detected',
    };
  }
  if (sig.strength === 'STRONG' && sig.confidence >= 85) {
    return {
      isHighVol: true,
      reason: `High-Confidence Breakout (${sig.confidence}%)`,
    };
  }
  return { isHighVol: false, reason: null };
}

export async function playAviatorAlertTone(
  tone: AviatorAlertToneId,
  volume = 0.22
): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (ctx.state !== 'running') {
      return false;
    }

    const now = ctx.currentTime;
    const clampedVol = Math.max(0.05, Math.min(0.6, volume));

    if (tone === 'SONAR_PING') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.34);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(clampedVol, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Subtle second harmonic echo
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      echoOsc.type = 'triangle';
      echoOsc.frequency.setValueAtTime(1760, now + 0.14);
      echoGain.gain.setValueAtTime(0.001, now + 0.14);
      echoGain.gain.exponentialRampToValueAtTime(clampedVol * 0.45, now + 0.16);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
      echoOsc.connect(echoGain);
      echoGain.connect(ctx.destination);
      echoOsc.start(now + 0.14);
      echoOsc.stop(now + 0.48);
    } else if (tone === 'VOLATILITY_SIREN') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.34);
      osc.frequency.exponentialRampToValueAtTime(1420, now + 0.5);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(clampedVol * 0.75, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.54);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    } else if (tone === 'QUANT_CHIME') {
      const notes = [880, 1174.66, 1567.98]; // A5, D6, G6
      notes.forEach((freq, i) => {
        const start = now + i * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(clampedVol * 0.8, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.34);
      });
    } else {
      // TACTICAL_PULSE: crisp double staccato pulse
      [0, 0.15].forEach((offset) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(980, start);
        osc.frequency.setValueAtTime(1280, start + 0.04);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(clampedVol * 0.55, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.13);
      });
    }

    return true;
  } catch {
    return false;
  }
}

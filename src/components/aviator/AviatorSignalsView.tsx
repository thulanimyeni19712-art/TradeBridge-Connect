import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAviator, SA_BOOKMAKERS } from '../../context/AviatorContext';
import { useTrading } from '../../context/TradingContext';
import { CrashSignal, BookmakerId } from '../../types/aviator';
import {
  AVIATOR_ALERT_TONES,
  AviatorAlertToneId,
  isHighVolatilitySignal,
  playAviatorAlertTone,
  unlockAviatorAudio,
} from '../../services/aviatorToneService';
import {
  Radio,
  Send,
  Clock,
  Activity,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';

const STORAGE_AUDIO_ENABLED_KEY = 'apex_aviator_radar_audio_enabled';
const STORAGE_AUDIO_TONE_KEY = 'apex_aviator_radar_audio_tone';

interface ConfidenceScoreRingProps {
  score: number;
  strength: CrashSignal['strength'];
  size?: number;
  strokeWidth?: number;
}

const ConfidenceScoreRing: React.FC<ConfidenceScoreRingProps> = ({
  score,
  strength,
  size = 56,
  strokeWidth = 5,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const strengthPalette: Record<
    CrashSignal['strength'],
    { stroke: string; track: string; textClass: string; label: string }
  > = {
    STRONG: {
      stroke: '#10b981',
      track: 'rgba(16, 185, 129, 0.16)',
      textClass: 'text-emerald-400',
      label: 'STRONG',
    },
    MODERATE: {
      stroke: '#f59e0b',
      track: 'rgba(245, 158, 11, 0.16)',
      textClass: 'text-amber-400',
      label: 'MODERATE',
    },
    WEAK: {
      stroke: '#f43f5e',
      track: 'rgba(244, 63, 94, 0.16)',
      textClass: 'text-rose-400',
      label: 'WEAK',
    },
  };

  const palette = strengthPalette[strength];

  return (
    <div
      className="flex items-center gap-3"
      role="meter"
      aria-label={`Confidence Score ${clamped}% (${palette.label})`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={palette.track}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={palette.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className={`absolute text-xs font-black font-mono tabular-nums ${palette.textClass}`}>
          {clamped}%
        </span>
      </div>

      <div className="min-w-0">
        <span className="text-[10px] text-slate-400 font-sans block">Confidence Score</span>
        <span className={`text-xs font-bold font-sans tracking-wide block ${palette.textClass}`}>
          {palette.label}
        </span>
      </div>
    </div>
  );
};

export const AviatorSignalsView: React.FC = () => {
  const {
    activeSignal,
    signalsHistory,
    broadcastSignal,
    generateSignalScan,
    isAutoBroadcast,
    setIsAutoBroadcast,
  } = useAviator();
  const { bridgeLatencyMs } = useTrading();

  const [selectedBookmaker, setSelectedBookmaker] = useState<'ALL' | BookmakerId>('ALL');
  const [filterStrength, setFilterStrength] = useState<'ALL' | 'STRONG' | 'MODERATE' | 'WEAK'>('ALL');
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Real-time MT5 Bridge Network Latency monitor (ms)
  const [measuredRttMs, setMeasuredRttMs] = useState<number | null>(null);
  const [mt5BridgeOnline, setMt5BridgeOnline] = useState<boolean>(true);

  // Audio notification toggle & selectable tone state (persisted)
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(STORAGE_AUDIO_ENABLED_KEY);
    return saved === null ? true : saved === 'true';
  });

  const [selectedTone, setSelectedTone] = useState<AviatorAlertToneId>(() => {
    if (typeof window === 'undefined') return 'SONAR_PING';
    const saved = window.localStorage.getItem(STORAGE_AUDIO_TONE_KEY) as AviatorAlertToneId | null;
    return AVIATOR_ALERT_TONES.some((t) => t.id === saved) ? (saved as AviatorAlertToneId) : 'SONAR_PING';
  });

  const [volatilityAlertNotice, setVolatilityAlertNotice] = useState<string | null>(null);
  const [audioBlockedHint, setAudioBlockedHint] = useState<boolean>(false);

  // Dynamic Live Signal Pulse Tracking
  const [isPulseActive, setIsPulseActive] = useState<boolean>(true);
  const [pulseCount, setPulseCount] = useState<number>(1);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const lastSignalIdRef = useRef<string | null>(activeSignal?.id ?? null);
  const lastAlertedSignalIdRef = useRef<string | null>(activeSignal?.id ?? null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const probeMt5Latency = useCallback(async (signal?: AbortSignal) => {
    const start = performance.now();
    try {
      const res = await fetch('/api/health', { cache: 'no-store', signal });
      const rtt = Math.max(0.4, Number((performance.now() - start).toFixed(1)));
      if (!signal?.aborted) {
        setMt5BridgeOnline(res.ok);
        setMeasuredRttMs(rtt);
      }
    } catch {
      if (!signal?.aborted) {
        setMt5BridgeOnline(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void probeMt5Latency(controller.signal);

    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    const probeTick = setInterval(() => {
      void probeMt5Latency(controller.signal);
    }, 4000);

    return () => {
      controller.abort();
      clearInterval(tick);
      clearInterval(probeTick);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [probeMt5Latency]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_AUDIO_ENABLED_KEY, String(audioAlertsEnabled));
    }
  }, [audioAlertsEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_AUDIO_TONE_KEY, selectedTone);
    }
  }, [selectedTone]);

  const triggerHighVolatilityAlert = async (sig: CrashSignal, forceTestSound = false) => {
    const volCheck = isHighVolatilitySignal(sig);
    if (!volCheck.isHighVol && !forceTestSound) return;

    const reasonText = volCheck.reason || `Signal Alert (${sig.predictedMultiplier.toFixed(2)}x)`;
    const toneObj = AVIATOR_ALERT_TONES.find((t) => t.id === selectedTone);

    if (audioAlertsEnabled || forceTestSound) {
      const played = await playAviatorAlertTone(selectedTone);
      if (!played) {
        setAudioBlockedHint(true);
      } else {
        setAudioBlockedHint(false);
      }
      setVolatilityAlertNotice(
        `High-Volatility Alert · ${sig.bookmaker}: ${reasonText} (${toneObj?.label ?? selectedTone})`
      );
      const t = setTimeout(() => {
        setVolatilityAlertNotice(null);
      }, 5000);
      timersRef.current.push(t);
    }
  };

  // Monitor activeSignal updates to trigger visual pulse & high-volatility audio notification
  useEffect(() => {
    if (activeSignal && activeSignal.id !== lastSignalIdRef.current) {
      lastSignalIdRef.current = activeSignal.id;
      setIsPulseActive(true);
      setPulseCount((c) => c + 1);

      if (activeSignal.id !== lastAlertedSignalIdRef.current) {
        lastAlertedSignalIdRef.current = activeSignal.id;
        void triggerHighVolatilityAlert(activeSignal);
      }

      const timer = setTimeout(() => {
        setIsPulseActive(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeSignal, audioAlertsEnabled, selectedTone]);

  // Combine active signal + deduplicated history
  const allSignals = [
    activeSignal,
    ...signalsHistory.filter((s) => s.id !== activeSignal.id),
  ];

  const filteredSignals = allSignals.filter((sig) => {
    if (selectedBookmaker !== 'ALL' && sig.bookmaker !== selectedBookmaker) return false;
    if (filterStrength !== 'ALL' && sig.strength !== filterStrength) return false;
    return true;
  });

  const handleToggleAudioAlerts = async () => {
    const next = !audioAlertsEnabled;
    setAudioAlertsEnabled(next);
    if (next) {
      const unlocked = await unlockAviatorAudio();
      if (unlocked) {
        setAudioBlockedHint(false);
        await playAviatorAlertTone(selectedTone, 0.18);
      }
    } else {
      setAudioBlockedHint(false);
      setVolatilityAlertNotice(null);
    }
  };

  const handleToneChange = async (newTone: AviatorAlertToneId) => {
    setSelectedTone(newTone);
    const unlocked = await unlockAviatorAudio();
    if (unlocked) {
      setAudioBlockedHint(false);
      await playAviatorAlertTone(newTone, 0.2);
    }
  };

  const handlePreviewTone = async () => {
    const unlocked = await unlockAviatorAudio();
    if (unlocked) {
      setAudioBlockedHint(false);
      await playAviatorAlertTone(selectedTone, 0.24);
      const toneObj = AVIATOR_ALERT_TONES.find((t) => t.id === selectedTone);
      setVolatilityAlertNotice(`Tone Preview Active · ${toneObj?.label} — ${toneObj?.description}`);
      const t = setTimeout(() => setVolatilityAlertNotice(null), 3500);
      timersRef.current.push(t);
    }
  };

  const handleManualBroadcast = async (sig: CrashSignal) => {
    setIsPulseActive(true);
    setPulseCount((c) => c + 1);
    const res = await broadcastSignal(sig);
    setBroadcastNotice(res.message);
    const t = setTimeout(() => {
      setBroadcastNotice(null);
      setIsPulseActive(false);
    }, 4500);
    timersRef.current.push(t);
  };

  const handleTriggerTestPulse = async () => {
    await unlockAviatorAudio();
    void probeMt5Latency();
    setIsPulseActive(true);
    setPulseCount((c) => c + 1);
    const bm = selectedBookmaker === 'ALL' ? undefined : selectedBookmaker;
    const scanned = generateSignalScan(bm);
    lastAlertedSignalIdRef.current = scanned.id;
    await triggerHighVolatilityAlert(scanned);
    setBroadcastNotice(
      `Prediction engine scan complete: ${scanned.bookmaker} @ ${scanned.predictedMultiplier.toFixed(2)}x (${scanned.confidence}% ${scanned.strength})`
    );
    const t = setTimeout(() => {
      setBroadcastNotice(null);
      setIsPulseActive(false);
    }, 4500);
    timersRef.current.push(t);
  };

  const effectiveLatencyMs = measuredRttMs ?? bridgeLatencyMs;
  const latencyHealth = !mt5BridgeOnline
    ? {
        label: 'Offline',
        textClass: 'text-rose-400',
        dotClass: 'bg-rose-400',
        iconClass: 'text-rose-400',
      }
    : effectiveLatencyMs <= 65
    ? {
        label: 'Healthy',
        textClass: 'text-emerald-400',
        dotClass: 'bg-emerald-400',
        iconClass: 'text-emerald-400',
      }
    : effectiveLatencyMs <= 160
    ? {
        label: 'Elevated',
        textClass: 'text-amber-400',
        dotClass: 'bg-amber-400',
        iconClass: 'text-amber-400',
      }
    : {
        label: 'Degraded',
        textClass: 'text-rose-400',
        dotClass: 'bg-rose-400',
        iconClass: 'text-rose-400',
      };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-mono">
      {/* Header & Controls Strip with Audio Volatility Alerts & MT5 Network Latency */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Radio className="w-4 h-4" />
            </span>
            <h2 className="text-base font-sans font-extrabold text-white tracking-wider uppercase">
              LIVE ALGORITHMIC SIGNALS RADAR
            </h2>

            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-[11px] font-sans font-semibold text-amber-300 tabular-nums">
              {isPulseActive ? 'Broadcast Pulse Active' : 'Radar Beacon Online'} (#{pulseCount})
            </span>

            <span className="text-slate-600" aria-hidden="true">·</span>
            <span
              role="status"
              aria-label={`MT5 Bridge Network Latency ${effectiveLatencyMs.toFixed(1)} milliseconds (${latencyHealth.label})`}
              title={`MT5 Bridge Network Latency: ${effectiveLatencyMs.toFixed(1)} ms (${latencyHealth.label})`}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0"
            >
              {mt5BridgeOnline ? (
                <Wifi className={`w-3.5 h-3.5 shrink-0 ${latencyHealth.iconClass}`} />
              ) : (
                <WifiOff className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              )}
              <span className="text-slate-400 font-sans">Network Latency</span>
              <span className={`font-bold ${latencyHealth.textClass}`}>
                {mt5BridgeOnline ? `${effectiveLatencyMs.toFixed(1)} ms` : 'Disconnected'}
              </span>
              <span className={`font-sans font-semibold ${latencyHealth.textClass}`}>
                · {latencyHealth.label}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Real-time pattern detections, Confidence Score telemetry, MT5 bridge latency health, and high-volatility audio alerts across SA bookmakers
          </p>
        </div>

        {/* Engine Scan, Volatility Audio Alert Toggle & Tone Selector, and Auto-Dispatch */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerTestPulse}
            className="min-h-[40px] px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-sans font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            title="Run the prediction engine to evaluate the next entry signal"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>SCAN ENGINE</span>
          </button>

          {/* High-Volatility Audio Alert Control Cluster */}
          <div className="flex items-center gap-1.5 bg-[#161D2B] border border-white/[0.08] rounded-xl p-1">
            <button
              type="button"
              onClick={handleToggleAudioAlerts}
              aria-pressed={audioAlertsEnabled}
              title={
                audioAlertsEnabled
                  ? 'Mute high-volatility audio alerts'
                  : 'Enable high-volatility audio alerts'
              }
              className={`min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-sans font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                audioAlertsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900/70 text-slate-400 border border-white/[0.06] hover:text-slate-200'
              }`}
            >
              {audioAlertsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span>{audioAlertsEnabled ? 'Audio Alerts ON' : 'Audio Muted'}</span>
            </button>

            <label htmlFor="aviator-alert-tone" className="sr-only">
              Select high-volatility alert tone
            </label>
            <select
              id="aviator-alert-tone"
              value={selectedTone}
              onChange={(e) => handleToneChange(e.target.value as AviatorAlertToneId)}
              aria-label="High-volatility alert tone"
              className="min-h-[34px] bg-[#090C12] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-sans font-semibold text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
            >
              {AVIATOR_ALERT_TONES.map((tone) => (
                <option key={tone.id} value={tone.id} className="bg-[#0F141E] text-slate-200">
                  {tone.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePreviewTone}
              title="Preview selected high-volatility alert tone"
              className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-white/[0.08] text-xs font-sans font-semibold transition flex items-center gap-1 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Test</span>
            </button>
          </div>

          <label className="min-h-[40px] flex items-center gap-2 bg-[#161D2B] border border-white/[0.08] rounded-xl px-3 py-1.5 cursor-pointer">
            <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="text-slate-200 font-sans font-bold">Auto-Dispatch</span>
              <span className="text-[9px] font-sans text-slate-500">Telegram &amp; Discord</span>
            </div>
            <input
              type="checkbox"
              checked={isAutoBroadcast}
              onChange={(e) => setIsAutoBroadcast(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded ml-1.5"
            />
          </label>
        </div>
      </div>

      {/* Audio Autoplay Unlock Hint (shown only if browser blocked pre-gesture playback) */}
      {audioBlockedHint && audioAlertsEnabled && (
        <div className="p-3 rounded-xl bg-[#161D2B] border border-cyan-500/30 text-cyan-200 text-xs font-sans flex items-center justify-between gap-2">
          <span>
            Browser audio is waiting for a click to arm alerts. Click Test to unlock real-time high-volatility sound playback.
          </span>
          <button
            type="button"
            onClick={handlePreviewTone}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0"
          >
            Arm Audio
          </button>
        </div>
      )}

      {/* High-Volatility Audio Trigger Banner */}
      {volatilityAlertNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold truncate">{volatilityAlertNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setVolatilityAlertNotice(null)}
            aria-label="Dismiss volatility alert"
            className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {broadcastNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-bold truncate">{broadcastNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
              DISPATCH ACTIVE
            </span>
            <button
              type="button"
              onClick={() => setBroadcastNotice(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1 overflow-x-auto max-w-full">
          <span className="text-[10px] text-slate-500 px-2 font-sans shrink-0">BOOKMAKER:</span>
          {(['ALL', ...SA_BOOKMAKERS.map((b) => b.id)] as const).map((bm) => (
            <button
              key={bm}
              type="button"
              onClick={() => setSelectedBookmaker(bm)}
              className={`px-2.5 py-1 text-xs rounded-lg font-sans transition whitespace-nowrap shrink-0 ${
                selectedBookmaker === bm
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {bm}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
          <span className="text-[10px] text-slate-500 px-2 font-sans shrink-0">STRENGTH:</span>
          {(['ALL', 'STRONG', 'MODERATE', 'WEAK'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterStrength(lvl)}
              className={`px-2.5 py-1 text-xs rounded-lg font-sans transition whitespace-nowrap shrink-0 ${
                filterStrength === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Cards Grid */}
      {filteredSignals.length === 0 ? (
        <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-8 text-center space-y-3">
          <p className="text-sm text-slate-300 font-sans">
            No broadcasted signals match the selected bookmaker and strength filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedBookmaker('ALL');
              setFilterStrength('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold font-sans"
          >
            Reset Signal Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map((sig, idx) => {
            const isLatest = idx === 0 && selectedBookmaker === 'ALL' && filterStrength === 'ALL';
            const isPinkWave = sig.predictedMultiplier >= 10.0;
            const volatilityCheck = isHighVolatilitySignal(sig);
            const ageSeconds = Math.max(0, Math.round((nowMs - sig.timestamp) / 1000));

            const cadenceMeta =
              isLatest && isPulseActive
                ? {
                    freqDurationClass: 'pulse-freq-burst',
                    ringColorClass: volatilityCheck.isHighVol
                      ? 'bg-rose-400'
                      : isPinkWave
                      ? 'bg-pink-400'
                      : 'bg-amber-400',
                    coreColorClass: volatilityCheck.isHighVol
                      ? 'bg-rose-400'
                      : isPinkWave
                      ? 'bg-pink-400'
                      : 'bg-amber-400',
                    barColorClass: volatilityCheck.isHighVol
                      ? 'bg-rose-400'
                      : isPinkWave
                      ? 'bg-pink-400'
                      : 'bg-amber-400',
                    cadenceText: 'Burst · 5s Cadence (0.20 Hz)',
                    textColorClass: volatilityCheck.isHighVol ? 'text-rose-300' : 'text-amber-300',
                  }
                : ageSeconds <= 20
                ? {
                    freqDurationClass: 'pulse-freq-live',
                    ringColorClass: 'bg-emerald-400',
                    coreColorClass: 'bg-emerald-400',
                    barColorClass: 'bg-emerald-400',
                    cadenceText: `Live · ${ageSeconds}s ago (0.20 Hz)`,
                    textColorClass: 'text-emerald-300',
                  }
                : ageSeconds <= 60
                ? {
                    freqDurationClass: 'pulse-freq-active',
                    ringColorClass: 'bg-cyan-400',
                    coreColorClass: 'bg-cyan-400',
                    barColorClass: 'bg-cyan-400',
                    cadenceText: `Active · ${ageSeconds}s ago (0.07 Hz)`,
                    textColorClass: 'text-cyan-300',
                  }
                : {
                    freqDurationClass: 'pulse-freq-calm',
                    ringColorClass: 'bg-slate-400',
                    coreColorClass: 'bg-slate-400',
                    barColorClass: 'bg-slate-400',
                    cadenceText: `Stream · ${Math.floor(ageSeconds / 60)}m ago`,
                    textColorClass: 'text-slate-400',
                  };

            return (
              <div
                key={sig.id}
                className={`rounded-2xl p-4 transition-colors duration-300 space-y-3 relative overflow-hidden bg-[#0F141E] ${
                  isLatest && isPulseActive ? 'signal-card-arrival' : ''
                } ${
                  isLatest
                    ? isPulseActive
                      ? 'border border-amber-400/70'
                      : 'border border-amber-500/35'
                    : ageSeconds <= 20
                    ? 'border border-emerald-500/25 hover:border-emerald-400/45'
                    : 'border border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Clean Metadata Kicker with Per-Entry Live Frequency Pulse Beacon */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0"
                      title={`Signal update frequency: ${cadenceMeta.cadenceText}`}
                      aria-hidden="true"
                    >
                      <span
                        className={`absolute inset-0 rounded-full signal-pulse-ring ${cadenceMeta.freqDurationClass} ${cadenceMeta.ringColorClass}`}
                      />
                      <span
                        className={`relative w-1.5 h-1.5 rounded-full ${cadenceMeta.coreColorClass}`}
                      />
                    </span>

                    <span className="font-sans font-bold text-amber-300 truncate">
                      {sig.bookmaker}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {isLatest ? 'Latest Signal' : sig.phase}
                    </span>
                    {volatilityCheck.isHighVol && (
                      <>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-rose-400 shrink-0">
                          High Volatility
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(sig.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Per-Entry Live Update Frequency Cadence Strip */}
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-end gap-0.5 h-3 shrink-0" aria-hidden="true">
                      <span
                        className={`w-0.5 h-3 rounded-xs signal-freq-bar ${cadenceMeta.freqDurationClass} ${cadenceMeta.barColorClass}`}
                      />
                      <span
                        className={`w-0.5 h-3 rounded-xs signal-freq-bar signal-bar-delay-1 ${cadenceMeta.freqDurationClass} ${cadenceMeta.barColorClass}`}
                      />
                      <span
                        className={`w-0.5 h-3 rounded-xs signal-freq-bar signal-bar-delay-2 ${cadenceMeta.freqDurationClass} ${cadenceMeta.barColorClass}`}
                      />
                    </span>
                    <span className={`truncate tabular-nums ${cadenceMeta.textColorClass}`}>
                      {cadenceMeta.cadenceText}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                    {sig.id}
                  </span>
                </div>

                {/* Multipliers & Circular Confidence Score Ring */}
                <div
                  className={`flex items-center justify-between gap-3 bg-slate-950/70 border rounded-xl p-3.5 transition-colors ${
                    isLatest && isPulseActive ? 'border-amber-400/50' : 'border-slate-800/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] font-sans text-slate-400 block">
                        Predicted Target
                      </span>
                      <span
                        className={`text-2xl font-black font-sans tabular-nums ${
                          isPinkWave ? 'text-pink-400' : 'text-amber-400'
                        }`}
                      >
                        {sig.predictedMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      Safe Cashout:{' '}
                      <span className="text-emerald-400 font-bold">
                        {sig.safeCashout.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  {/* Circular Progress Ring Confidence Score Indicator (0-100%) */}
                  <ConfidenceScoreRing score={sig.confidence} strength={sig.strength} />
                </div>

                {/* Signal Telemetry Summary (Unboxed hairline grid) */}
                <div className="grid grid-cols-3 divide-x divide-white/[0.08] text-[11px] pt-1">
                  <div className="pr-2">
                    <span className="text-slate-500 font-sans block">Pattern</span>
                    <span className="font-bold text-slate-200 truncate block">
                      {sig.pattern.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="px-2">
                    <span className="text-slate-500 font-sans block">MACD / Trend</span>
                    <span className="font-bold text-cyan-300 block">
                      {sig.macdSignal} · {sig.trend}
                    </span>
                  </div>
                  <div className="pl-2 text-right">
                    <span className="text-slate-500 font-sans block">Stochastic</span>
                    <span className="font-bold text-slate-200 tabular-nums block">
                      {sig.stochValue.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleManualBroadcast(sig)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-sans font-semibold transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DISPATCH TO TELEGRAM / DISCORD</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


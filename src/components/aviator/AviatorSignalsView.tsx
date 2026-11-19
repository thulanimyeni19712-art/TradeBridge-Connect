import React, { useState, useEffect, useRef } from 'react';
import { useAviator, SA_BOOKMAKERS } from '../../context/AviatorContext';
import { CrashSignal, BookmakerId } from '../../types/aviator';
import {
  Radio,
  Send,
  Clock,
  Activity,
  RefreshCw,
  X,
} from 'lucide-react';

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
        <span className={`text-xs font-bold font-orbitron tracking-wide block ${palette.textClass}`}>
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

  const [selectedBookmaker, setSelectedBookmaker] = useState<'ALL' | BookmakerId>('ALL');
  const [filterStrength, setFilterStrength] = useState<'ALL' | 'STRONG' | 'MODERATE' | 'WEAK'>('ALL');
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Dynamic Live Signal Pulse Tracking
  const [isPulseActive, setIsPulseActive] = useState<boolean>(true);
  const [pulseCount, setPulseCount] = useState<number>(1);
  const lastSignalIdRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Monitor activeSignal updates to trigger immediate dynamic pulse glow confirmation
  useEffect(() => {
    if (activeSignal && activeSignal.id !== lastSignalIdRef.current) {
      lastSignalIdRef.current = activeSignal.id;
      setIsPulseActive(true);
      setPulseCount((c) => c + 1);
      const timer = setTimeout(() => {
        setIsPulseActive(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeSignal]);

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

  const handleTriggerTestPulse = () => {
    setIsPulseActive(true);
    setPulseCount((c) => c + 1);
    const bm = selectedBookmaker === 'ALL' ? undefined : selectedBookmaker;
    const scanned = generateSignalScan(bm);
    setBroadcastNotice(
      `Prediction engine scan complete: ${scanned.bookmaker} @ ${scanned.predictedMultiplier.toFixed(2)}x (${scanned.confidence}% ${scanned.strength})`
    );
    const t = setTimeout(() => {
      setBroadcastNotice(null);
      setIsPulseActive(false);
    }, 4500);
    timersRef.current.push(t);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-mono">
      {/* Header & Controls Strip with Live Pulse Beacon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0d14] border border-amber-500/20 rounded-2xl p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Radio className="w-4 h-4" />
            </span>
            <h2 className="text-base font-orbitron font-extrabold text-white tracking-wider uppercase">
              LIVE ALGORITHMIC SIGNALS RADAR
            </h2>

            {/* Dynamic Live Pulse Indicator in Header */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="relative flex h-2.5 w-2.5">
                {isPulseActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                )}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="text-[10px] font-orbitron font-black tracking-wider uppercase flex items-center gap-1.5">
                <span>{isPulseActive ? 'SIGNAL BROADCAST PULSE' : 'RADAR BEACON ACTIVE'}</span>
                <span className="text-[9px] text-slate-400 font-mono tabular-nums">(#{pulseCount})</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Real-time pattern detections with prediction engine Confidence Score across South African bookmakers
          </p>
        </div>

        {/* Engine Scan Trigger & Auto-Broadcast Switch */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleTriggerTestPulse}
            className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-orbitron font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
            title="Run the prediction engine to evaluate the next entry signal"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>SCAN ENGINE</span>
          </button>

          <label className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 cursor-pointer">
            <Send className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col text-[11px]">
              <span className="text-slate-300 font-bold">Auto-Dispatch</span>
              <span className="text-[9px] text-slate-500">Telegram &amp; Discord</span>
            </div>
            <input
              type="checkbox"
              checked={isAutoBroadcast}
              onChange={(e) => setIsAutoBroadcast(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded ml-2"
            />
          </label>
        </div>
      </div>

      {broadcastNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs flex items-center justify-between gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-bold truncate">{broadcastNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
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
          <span className="text-[10px] text-slate-500 px-2 font-orbitron shrink-0">BOOKMAKER:</span>
          {(['ALL', ...SA_BOOKMAKERS.map((b) => b.id)] as const).map((bm) => (
            <button
              key={bm}
              type="button"
              onClick={() => setSelectedBookmaker(bm)}
              className={`px-2.5 py-1 text-xs rounded-lg font-orbitron transition whitespace-nowrap shrink-0 ${
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
          <span className="text-[10px] text-slate-500 px-2 font-orbitron shrink-0">STRENGTH:</span>
          {(['ALL', 'STRONG', 'MODERATE', 'WEAK'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterStrength(lvl)}
              className={`px-2.5 py-1 text-xs rounded-lg font-orbitron transition whitespace-nowrap shrink-0 ${
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
        <div className="rounded-2xl bg-[#0a0d16] border border-slate-800 p-8 text-center space-y-3">
          <p className="text-sm text-slate-300 font-sans">
            No broadcasted signals match the selected bookmaker and strength filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedBookmaker('ALL');
              setFilterStrength('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold font-orbitron"
          >
            Reset Signal Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map((sig, idx) => {
            const isLatest = idx === 0 && selectedBookmaker === 'ALL' && filterStrength === 'ALL';
            const isPinkWave = sig.predictedMultiplier >= 10.0;
            return (
              <div
                key={`${sig.id}-${idx}`}
                className={`rounded-2xl p-4 transition-all duration-500 space-y-3 relative overflow-hidden ${
                  isLatest
                    ? isPulseActive
                      ? 'signal-glass border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/70'
                      : 'signal-glass border-amber-500/40 shadow-[0_0_20px_rgba(232,185,35,0.2)]'
                    : 'bg-[#0a0d16] border border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Clean Metadata Kicker */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-orbitron font-bold text-amber-300 truncate">
                      {sig.bookmaker}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {isLatest ? 'Latest Signal' : sig.phase}
                    </span>
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
                        className={`text-2xl font-black font-orbitron tabular-nums ${
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
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-orbitron font-semibold transition flex items-center justify-center gap-2"
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

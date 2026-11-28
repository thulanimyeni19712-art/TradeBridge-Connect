import React from 'react';
import { useAviator } from '../../context/AviatorContext';
import { useTrading } from '../../context/TradingContext';
import {
  Cpu,
  Gauge,
  Radio,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AviatorSubTab } from './NguniAviatorApp';
import {
  speechNotifier,
  useSpeechNotifications,
} from '../../services/speechNotificationService';

interface AviatorGlobalStatusPanelProps {
  onNavigateTab?: (tab: AviatorSubTab) => void;
}

export const AviatorGlobalStatusPanel: React.FC<AviatorGlobalStatusPanelProps> = ({
  onNavigateTab,
}) => {
  const {
    bookmakerInfo,
    flightStatus,
    currentMultiplier,
    activeSignal,
    signalsHistory,
    eaSettings,
    toggleEaBot,
    eaWinCount,
    eaLossCount,
    eaTotalProfit,
    rounds,
  } = useAviator();

  const {
    bridgeLatencyMs,
    terminals,
    automatedSettings,
    positions,
    ticksPerSecond,
    isBridgeConnected,
  } = useTrading();

  const { settings: speechSettings } = useSpeechNotifications();

  // Compute aggregate signal accuracy from live EA win/loss track record + active AI confidence
  const totalEaTrades = eaWinCount + eaLossCount;
  const historicalAccuracy =
    totalEaTrades > 0 ? (eaWinCount / totalEaTrades) * 100 : activeSignal.confidence;
  const blendedAccuracy =
    signalsHistory.length > 0
      ? (historicalAccuracy * 0.65 +
          (signalsHistory.reduce((acc, s) => acc + s.confidence, 0) / signalsHistory.length) *
            0.35)
      : historicalAccuracy * 0.6 + activeSignal.confidence * 0.4;

  // Aggregate active bot counts across all trading modules
  const aviatorBotsActive = eaSettings.isRunning ? 1 : 0;
  const mt5AutoBotsActive = automatedSettings.masterAutoTrading
    ? automatedSettings.activeEAsCount
    : 0;
  const cloudTerminalsActive = terminals.filter((t) => t.status === 'ONLINE').length;
  const totalActiveBots = aviatorBotsActive + mt5AutoBotsActive + cloudTerminalsActive;
  const totalConfiguredBots = 1 + automatedSettings.activeEAsCount + terminals.length;

  // Determine latency health status text (no hue-only signaling)
  const latencyStatus =
    bridgeLatencyMs <= 2.5
      ? { label: 'Optimal', textClass: 'text-emerald-400' }
      : bridgeLatencyMs <= 6.0
      ? { label: 'Nominal', textClass: 'text-amber-400' }
      : { label: 'Elevated', textClass: 'text-rose-400' };

  return (
    <section
      aria-label="Global Status Overview"
      className="bg-[#070b14] border border-white/10 rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 font-mono"
    >
      {/* Top Row: Section Header & Quick Interactive Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-display font-bold text-white tracking-wide">
              Global Status
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              Aggregate telemetry across Aviator Predictor, EA Lab, and MT5 Bridge modules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              speechNotifier.updateSettings({ enabled: !speechSettings.enabled })
            }
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              speechSettings.enabled
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 hover:bg-cyan-500/25'
                : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
            }`}
            title={speechSettings.enabled ? 'Mute Voice Announcer' : 'Unmute Voice Announcer'}
          >
            {speechSettings.enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{speechSettings.enabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
          <button
            type="button"
            onClick={toggleEaBot}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              eaSettings.isRunning
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {eaSettings.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Aviator EA</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Start Aviator EA</span>
              </>
            )}
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('EA_LAB')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium transition flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Open Lab</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Aggregate Metric Strip (Tabular Numerals, Hairline Dividers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] pt-3">
        {/* Metric 1: Aggregate Signal Accuracy */}
        <div className="py-2 sm:py-0 sm:pr-4 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Signal Accuracy
            </span>
            <span className="text-emerald-400 font-semibold">
              {blendedAccuracy >= 80 ? 'High Precision' : 'Calibrating'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {blendedAccuracy.toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {eaWinCount}W / {eaLossCount}L · {activeSignal.confidence}% AI
            </span>
          </div>
        </div>

        {/* Metric 2: Execution & Feed Latency */}
        <div className="py-2 sm:py-0 sm:px-4 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Global Latency
            </span>
            <span className={`font-semibold ${latencyStatus.textClass}`}>
              {isBridgeConnected ? latencyStatus.label : 'Offline'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold text-cyan-300 tabular-nums">
              {bridgeLatencyMs.toFixed(1)} ms
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {ticksPerSecond} ticks/s · {bookmakerInfo.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Bots Across All Modules */}
        <div className="py-2 sm:py-0 sm:px-4 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Active Bots (All Modules)
            </span>
            <span className="text-slate-300 font-semibold tabular-nums">
              {totalActiveBots} / {totalConfiguredBots} Live
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {totalActiveBots}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums truncate">
              Lab {aviatorBotsActive} · MT5 {mt5AutoBotsActive} · Nodes {cloudTerminalsActive}
            </span>
          </div>
        </div>

        {/* Metric 4: Engine State & Combined Exposure */}
        <div className="py-2 sm:py-0 sm:pl-4 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Engine &amp; Positions
            </span>
            <span
              className={`font-semibold ${
                flightStatus === 'FLYING'
                  ? 'text-emerald-400'
                  : flightStatus === 'CRASHED'
                  ? 'text-rose-400'
                  : 'text-amber-300'
              }`}
            >
              {flightStatus}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums">
              {currentMultiplier.toFixed(2)}x
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              +{eaTotalProfit} ZAR · {positions.length} Bridge Open · {rounds.length} Rounds
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

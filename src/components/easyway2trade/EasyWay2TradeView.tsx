import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { RobotStrategy, TradingSignal, OrderSide } from '../../types/trading';
import {
  Cpu,
  Zap,
  TrendingUp,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Sparkles,
  BarChart3,
  Award,
  Layers,
  ArrowRight,
  Target,
  Play,
  Flame,
} from 'lucide-react';

interface EasyWay2TradeViewProps {
  onExecuteSignal: (symbol: string, side: OrderSide, sl: number, tp: number, lots?: number) => void;
}

export const EasyWay2TradeView: React.FC<EasyWay2TradeViewProps> = ({ onExecuteSignal }) => {
  const { robots, signals, presets, downloadPreset } = useTrading();
  const [selectedRobot, setSelectedRobot] = useState<RobotStrategy>(robots[0]);
  const [activeRiskMode, setActiveRiskMode] = useState<'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'>('CONSERVATIVE');
  const [executedSignalId, setExecutedSignalId] = useState<string | null>(null);
  const [presetDownloaded, setPresetDownloaded] = useState<boolean>(false);

  const handleExecute = (sig: TradingSignal) => {
    onExecuteSignal(sig.symbol, sig.side, sig.sl, sig.tp1, 1.0);
    setExecutedSignalId(sig.id);
    setTimeout(() => setExecutedSignalId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c1424] via-[#09101c] to-[#120e24] border border-cyan-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>EasyWay2Trade • Official Algorithmic Ecosystem</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Institutional Expert Advisors & Automated Trading Signals
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            High-precision algorithmic trading robots designed for MetaTrader 4, MetaTrader 5, and Emerge Prop challenges. Built-in zero-martingale risk shields, ICT Fair Value Gap harvesters, and dynamic slippage filtering.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Prop Firm Passing Verified (100% Pass Rate)</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
              <Award className="w-4 h-4" />
              <span>Real Tick-Data 99.9% Model Quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Robots Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Flagship Expert Advisors (EAs)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Select a robot to inspect & configure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {robots.map((robot) => {
            const isSelected = selectedRobot.id === robot.id;
            return (
              <div
                key={robot.id}
                onClick={() => setSelectedRobot(robot)}
                className={`p-5 rounded-2xl cursor-pointer transition relative overflow-hidden border ${
                  isSelected
                    ? 'bg-[#121927] border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                    : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 hover:bg-[#0f141f]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="bg-cyan-500 text-slate-950 text-[9px] font-bold py-0.5 text-center transform rotate-45 translate-x-4 translate-y-2 uppercase font-mono">
                      Active
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm leading-tight">{robot.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{robot.codeName}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 my-2.5 leading-relaxed">
                  {robot.description}
                </p>

                <div className="grid grid-cols-2 gap-2 my-3 font-mono text-xs tabular-nums">
                  <div className="p-2 bg-[#080b10] rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Win Rate</span>
                    <span className="text-emerald-400 font-bold">{robot.winRate}%</span>
                  </div>
                  <div className="p-2 bg-[#080b10] rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Profit Factor</span>
                    <span className="text-cyan-400 font-bold">{robot.profitFactor}</span>
                  </div>
                  <div className="p-2 bg-[#080b10] rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Max Drawdown</span>
                    <span className="text-amber-400 font-bold">{robot.maxDrawdown}%</span>
                  </div>
                  <div className="p-2 bg-[#080b10] rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Monthly ROI</span>
                    <span className="text-emerald-400 font-bold">+{robot.monthlyReturn}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {robot.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Robot Deep Dive & Configuration */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-100">{selectedRobot.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {selectedRobot.activeStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Optimized Timeframes: <span className="text-cyan-300 font-mono">{selectedRobot.timeframe}</span> | Supported Pairs: <span className="text-slate-200 font-mono">{selectedRobot.pairs.join(', ')}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Risk Preset:</span>
            <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto no-scrollbar">
              {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveRiskMode(mode)}
                  className={`px-3 py-1 rounded-lg transition text-[11px] font-semibold ${
                    activeRiskMode === mode
                      ? mode === 'CONSERVATIVE'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : mode === 'MODERATE'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-rose-500 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-4 bg-[#111622] rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 uppercase font-mono">Evaluation Suitability</div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Emerge 2-Phase & 1-Phase Challenges</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains strict 4% max daily loss ceiling and 8% overall trailing drawdown guard. Zero overnight or weekend holding penalty.
            </p>
          </div>

          <div className="p-4 bg-[#111622] rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 uppercase font-mono">Execution Architecture</div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Direct DMA Bridge Integration</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executes trades in 1.4ms to 3.2ms. Bypasses dealer desk re-quotes through London Equinix LD4 cross-connect.
            </p>
          </div>

          <div className="p-4 bg-[#111622] rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 uppercase font-mono">Verified Preset (.SET)</div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Official EasyWay2Trade Presets</span>
            </div>
            <button
              onClick={() => {
                const matched =
                  presets.find((p) =>
                    p.robotName.toLowerCase().includes(selectedRobot.name.split(' ')[0].toLowerCase())
                  ) || presets[0];
                if (matched) {
                  downloadPreset(matched.id);
                  setPresetDownloaded(true);
                  setTimeout(() => setPresetDownloaded(false), 2500);
                }
              }}
              className="w-full mt-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <span>{presetDownloaded ? '✓ Preset Downloaded!' : `Download ${selectedRobot.codeName} .SET`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Algorithmic Signal Radar */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Live Algorithmic Signal Radar
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Scanning London & NY Liquidity Pools</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {signals.map((sig) => (
            <div
              key={sig.id}
              className="bg-[#101520] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 font-mono">{sig.symbol}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        sig.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {sig.side}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{sig.timestamp}</span>
                </div>

                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{sig.robotName}</span>
                </div>

                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {sig.reason}
                </p>

                <div className="bg-[#0a0d14] rounded-lg p-2.5 border border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] font-mono mb-3">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Entry</span>
                    <span className="text-slate-200 font-bold">{sig.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">SL</span>
                    <span className="text-rose-400 font-bold">{sig.sl}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">TP 1</span>
                    <span className="text-emerald-400 font-bold">{sig.tp1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
                  <span>Confidence Score:</span>
                  <span className="font-bold text-cyan-400">{sig.confidence}%</span>
                </div>
              </div>

              <button
                onClick={() => handleExecute(sig)}
                className={`w-full py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg ${
                  executedSignalId === sig.id
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                }`}
              >
                {executedSignalId === sig.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signal Transmitted to Bridge!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Execute Signal via Bridge</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

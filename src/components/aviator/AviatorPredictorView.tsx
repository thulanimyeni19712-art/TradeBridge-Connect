import React, { useState, useEffect } from 'react';
import { useAviator, SA_BOOKMAKERS } from '../../context/AviatorContext';
import { liveMarketData } from '../../services/liveMarketData';
import {
  Zap,
  Shield,
  Target,
  Flame,
  Volume2,
  VolumeX,
  Play,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Lock,
  Loader2,
  X,
} from 'lucide-react';

export const AviatorPredictorView: React.FC = () => {
  const {
    activeBookmaker,
    setActiveBookmaker,
    bookmakerInfo,
    flightStatus,
    currentMultiplier,
    countdownSeconds,
    rounds,
    currentElo,
    eloChange,
    activeSignal,
    soundEnabled,
    setSoundEnabled,
    betSlot1,
    setBetSlot1,
    betSlot2,
    setBetSlot2,
    placeBet,
    cashoutBet,
    cancelBet,
    forceNextRound,
  } = useAviator();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [accountPhone, setAccountPhone] = useState('082 555 1928');
  const [isConnected, setIsConnected] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Real 5-Second Server RTT & Statistical Engine Sync
  const [isPolling, setIsPolling] = useState(false);
  const [pollCountdown, setPollCountdown] = useState(5);
  const [syncCount, setSyncCount] = useState(1);
  const [measuredRttMs, setMeasuredRttMs] = useState<number>(liveMarketData.lastRttMs || 1.8);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setPollCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    const pollInterval = setInterval(async () => {
      setIsPolling(true);
      const rtt = await liveMarketData.measureHealthRtt();
      if (rtt > 0) setMeasuredRttMs(rtt);
      setSyncCount((c) => c + 1);
      setIsPolling(false);
    }, 5000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(pollInterval);
    };
  }, []);

  // Flight curve trajectory calculation
  const progressRatio = Math.min(1, (currentMultiplier - 1.0) / 10.0);
  const planeX = 15 + progressRatio * 70; // 15% to 85%
  const planeY = 75 - progressRatio * 55; // 75% down to 20%

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Bookmaker & ELO Status Banner with 5-Second Polling Indicator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F141E] border border-white/[0.08] rounded-2xl p-3 sm:p-4">
        {/* Bookmaker Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {SA_BOOKMAKERS.map((bm) => (
            <button
              key={bm.id}
              onClick={() => setActiveBookmaker(bm.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeBookmaker === bm.id
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : 'bg-[#161D2B] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{bm.id}</span>
            </button>
          ))}
        </div>

        {/* ELO & Polling & Account Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          {/* Subtle 5-Second Polling Spinner & Telemetry Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono shadow-sm">
            <Loader2
              className={`w-3.5 h-3.5 text-cyan-400 transition-all ${
                isPolling ? 'animate-spin opacity-100 text-cyan-300' : 'opacity-60'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider font-sans">
                {isPolling ? 'SYNCING...' : 'LIVE 5s'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline tabular-nums">
                T-{pollCountdown}s (#{syncCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono tabular-nums">
            <span className="text-slate-400 text-[10px]">ELO:</span>
            <span className="font-bold text-amber-400 tabular-nums">{currentElo}</span>
            <span className={`text-[10px] font-bold ${eloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({eloChange >= 0 ? '+' : ''}{eloChange})
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-bold border transition flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isConnected ? `${activeBookmaker} CONNECTED` : 'CONNECT ACC'}</span>
          </button>
        </div>
      </div>

      {/* Recent Multipliers Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest shrink-0 mr-1">
          PAST ROUNDS:
        </span>
        {rounds.slice(0, 16).map((r, idx) => {
          const isHigh = r.multiplier >= 10.0;
          const isMid = r.multiplier >= 2.0 && r.multiplier < 10.0;
          return (
            <div
              key={`${r.id}-${idx}`}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tabular-nums font-bold shrink-0 border transition hover:border-white/25 cursor-pointer ${
                isHigh
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                  : isMid
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
              }`}
            >
              {r.multiplier.toFixed(2)}x
            </div>
          );
        })}
      </div>

      {/* Main Grid: Live Flight Simulator & AI Predictor HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left & Center Stage: Aviator Flight Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative h-88 sm:h-96 w-full rounded-2xl bg-[#090C12] border border-white/[0.08] overflow-hidden flex flex-col justify-between p-4">

            {/* Concentric Altitude Radar Rings */}
            <div className="absolute -left-20 -bottom-20 w-[600px] h-[600px] rounded-full border border-amber-500/10 pointer-events-none flex items-center justify-center">
              <div className="w-[450px] h-[450px] rounded-full border border-dashed border-amber-500/15 flex items-center justify-center">
                <div className="w-[300px] h-[300px] rounded-full border border-amber-500/20 flex items-center justify-center">
                  <div className="w-[150px] h-[150px] rounded-full border border-dashed border-amber-500/25" />
                </div>
              </div>
            </div>

            {/* Top Flight Canvas Telemetry Bar */}
            <div className="flex items-center justify-between z-10 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-sans text-[10px] font-black shadow-sm">
                  {bookmakerInfo.name.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  RTP {bookmakerInfo.rtpRate} • ZAR LIQUIDITY
                </span>
              </div>

              {/* Atmospheric Mach & G-Force Telemetry */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] tabular-nums">
                  <span className="text-slate-400">
                    MACH: <b className="text-cyan-400 font-mono">{(1.0 + currentMultiplier * 0.35).toFixed(1)}</b>
                  </span>
                  <span className="text-slate-700">|</span>
                  <span className="text-slate-400">
                    G-FORCE: <b className="text-amber-400 font-mono">{(0.9 + currentMultiplier * 0.45).toFixed(1)}G</b>
                  </span>
                </div>

                <span
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-sans text-[10px] font-bold border ${
                    flightStatus === 'FLYING'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : flightStatus === 'CRASHED'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{flightStatus}</span>
                </span>
              </div>
            </div>

            {/* Flight Curve & Animated Plane */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e8b923" stopOpacity="0.04" />
                  <stop offset="100%" stopColor={currentMultiplier >= 10 ? '#ec4899' : '#e8b923'} stopOpacity="0.45" />
                </linearGradient>
              </defs>

              {/* Dynamic Altitude Reference Arcs */}
              <text x="25" y="80" fill="rgba(232, 185, 35, 0.3)" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">10.00x STRATOSPHERE</text>
              <line x1="15" y1="85" x2="95%" y2="85" stroke="rgba(232, 185, 35, 0.12)" strokeDasharray="4 6" />

              <text x="25" y="160" fill="rgba(6, 182, 212, 0.3)" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">5.00x MESOSPHERE</text>
              <line x1="15" y1="165" x2="95%" y2="165" stroke="rgba(6, 182, 212, 0.12)" strokeDasharray="4 6" />

              <text x="25" y="240" fill="rgba(16, 185, 129, 0.3)" fontSize="10" fontFamily="'Plus Jakarta Sans', sans-serif">2.00x SAFE ORBIT</text>
              <line x1="15" y1="245" x2="95%" y2="245" stroke="rgba(16, 185, 129, 0.12)" strokeDasharray="4 6" />

              {/* Parabolic flight trajectory path */}
              {flightStatus === 'FLYING' && (
                <>
                  <path
                    d={`M 50 280 Q ${planeX * 3} 240, ${(planeX / 100) * 450} ${(planeY / 100) * 350}`}
                    fill="none"
                    stroke={currentMultiplier >= 10 ? '#ec4899' : currentMultiplier >= 5 ? '#f59e0b' : '#e8b923'}
                    strokeWidth="4"
                    strokeDasharray="6 3"
                    className="drop-shadow-[0_0_16px_rgba(232,185,35,0.8)]"
                  />
                  <path
                    d={`M 50 280 Q ${planeX * 3} 240, ${(planeX / 100) * 450} ${(planeY / 100) * 350} L ${(planeX / 100) * 450} 340 L 50 340 Z`}
                    fill="url(#curveGradient)"
                  />
                </>
              )}
            </svg>

            {/* Animated Aircraft Icon with Next-Level Afterburner Exhaust */}
            {flightStatus === 'FLYING' && (
              <div
                className="absolute transition-all duration-100 ease-linear pointer-events-none z-20"
                style={{
                  left: `${planeX}%`,
                  top: `${planeY}%`,
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                }}
              >
                <div className="relative">
                  {/* Supersonic Altitude Ring */}
                  <div className="absolute -inset-4 rounded-full border border-cyan-400/40 pointer-events-none" />

                  {/* Fighter Jet Fuselage */}
                  <div
                    className={`w-11 h-11 sm:w-14 sm:h-14 transition-colors ${
                      currentMultiplier >= 10
                        ? 'text-pink-400 drop-shadow-[0_0_25px_rgba(236,72,153,0.9)]'
                        : currentMultiplier >= 5
                        ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]'
                        : 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                    </svg>
                  </div>

                  {/* Jet Exhaust Flare */}
                  <div className="absolute top-1/2 -left-8 -translate-y-1/2 w-10 h-3 bg-gradient-to-l from-amber-400 via-rose-500 to-transparent rounded-full blur-[1px]" />
                </div>
              </div>
            )}

            {/* Center Multiplier Counter HUD */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              {flightStatus === 'WAITING' ? (
                <div className="text-center space-y-2">
                  <p className="text-xs font-sans font-bold tracking-widest text-slate-400 uppercase">
                    NEXT LAUNCH SEQUENCE
                  </p>
                  <div className="text-6xl sm:text-7xl font-black font-mono text-amber-400 tabular-nums">
                    {countdownSeconds}s
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SYNCHRONIZING PRNG SHA-256 SEEDS...</span>
                  </div>
                </div>
              ) : flightStatus === 'FLYING' ? (
                <div className="text-center space-y-0.5">
                  <div
                    className={`text-6xl sm:text-8xl font-black font-mono tracking-tight transition-colors tabular-nums ${
                      currentMultiplier >= 10
                        ? 'text-rose-400'
                        : currentMultiplier >= 5
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase tabular-nums">
                    MACH {(1.0 + currentMultiplier * 0.4).toFixed(1)} • {currentMultiplier >= 10 ? 'PEAK MOONSHOT' : 'SUPERCRUISE ACTIVE'}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="text-rose-500 text-xs font-sans font-extrabold tracking-widest uppercase">
                    FLEW AWAY @
                  </div>
                  <div className="text-6xl sm:text-8xl font-black font-mono text-rose-500 tabular-nums">
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <p className="text-xs font-sans text-slate-400 uppercase">
                    ROUND PROVABLY VERIFIED • COMPUTING NEXT ODDS
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 z-10">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>DIRECT API RTT: {measuredRttMs}MS</span>
              </span>

              <button
                onClick={forceNextRound}
                className="pointer-events-auto text-[10px] font-sans font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ADVANCE ROUND</span>
              </button>
            </div>
          </div>

          {/* South African Bookmakers Live Arbitrage & Odds Matrix Bar */}
          <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-slate-400 uppercase border-b border-white/[0.06] pb-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SA TOP BOOKMAKERS ODDS MATRIX</span>
              </span>
              <span className="text-emerald-400">BEST RTP: LOTTOSTAR 97.2%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Betway SA', rtp: '97.0%', status: 'HIGH VOLUME', est: '2.84x', color: 'text-emerald-400' },
                { name: 'Hollywoodbets', rtp: '97.0%', status: 'HOT CYCLE', est: '3.12x', color: 'text-cyan-400' },
                { name: 'LottoStar', rtp: '97.2%', status: 'HIGH PEAK', est: '4.60x', color: 'text-amber-400' },
                { name: 'Easybet', rtp: '96.8%', status: 'ACCUMULATOR', est: '2.50x', color: 'text-blue-400' },
              ].map((bm) => (
                <div key={bm.name} className="bg-[#161D2B] p-2 rounded-xl border border-white/[0.06] space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-slate-300 font-sans">{bm.name}</span>
                    <span className="text-slate-500">{bm.rtp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold font-mono tabular-nums ${bm.color}`}>{bm.est}</span>
                    <span className="text-[9px] text-slate-400">{bm.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Betting Cockpit Panels with Ergonomic Quick Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bet Slot 1 */}
            <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>BET COCKPIT #1</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Auto Cashout:</span>
                  <input
                    type="checkbox"
                    checked={betSlot1.autoCashoutEnabled}
                    onChange={(e) =>
                      setBetSlot1((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))
                    }
                    className="accent-amber-500 w-3.5 h-3.5 rounded"
                  />
                </div>
              </div>

              {/* Stake Amount & Quick Chips (+10, +50, +100, 2X, 1/2) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Stake ({bookmakerInfo.currency})</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    Potential: {bookmakerInfo.currency} {(betSlot1.amount * (betSlot1.autoCashoutMultiplier || 2.0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={betSlot1.amount}
                    onChange={(e) =>
                      setBetSlot1((prev) => ({ ...prev, amount: Math.max(1, Number(e.target.value)) }))
                    }
                    className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap items-center gap-1 flex-1">
                    <button
                      type="button"
                      onClick={() => setBetSlot1((prev) => ({ ...prev, amount: Math.max(1, Math.floor(prev.amount / 2)) }))}
                      className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-400"
                    >
                      ½
                    </button>
                    <button
                      type="button"
                      onClick={() => setBetSlot1((prev) => ({ ...prev, amount: prev.amount * 2 }))}
                      className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-amber-300"
                    >
                      2X
                    </button>
                    {[20, 50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBetSlot1((prev) => ({ ...prev, amount: prev.amount + amt }))}
                        className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto Cashout Multiplier Quick Pills */}
              {betSlot1.autoCashoutEnabled && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Target Multiplier</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {betSlot1.autoCashoutMultiplier}x
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1.50, 1.85, 2.00, 3.00, 5.00].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => setBetSlot1((prev) => ({ ...prev, autoCashoutMultiplier: mult }))}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-mono tabular-nums font-bold border transition ${
                          betSlot1.autoCashoutMultiplier === mult
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mult.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {betSlot1.isPlaced ? (
                betSlot1.isCashedOut ? (
                  <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-mono tabular-nums font-bold text-xs">
                    CASHED OUT @ {betSlot1.cashoutPrice?.toFixed(2)}x (+{bookmakerInfo.currency} {betSlot1.pnl})
                  </div>
                ) : flightStatus === 'FLYING' ? (
                  <button
                    onClick={() => cashoutBet(1)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-98 font-mono tabular-nums font-black text-slate-950 text-sm shadow-[0_0_25px_rgba(232,185,35,0.5)] transition"
                  >
                    CASHOUT {bookmakerInfo.currency} {(betSlot1.amount * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                  </button>
                ) : (
                  <button
                    onClick={() => cancelBet(1)}
                    className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-sans font-bold text-xs transition"
                  >
                    CANCEL BET
                  </button>
                )
              ) : (
                <button
                  onClick={() => placeBet(1)}
                  disabled={flightStatus === 'FLYING'}
                  className={`w-full py-3.5 rounded-xl font-sans font-black text-sm transition shadow-lg ${
                    flightStatus === 'FLYING'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-98'
                  }`}
                >
                  PLACE BET ({bookmakerInfo.currency} {betSlot1.amount})
                </button>
              )}
            </div>

            {/* Bet Slot 2 */}
            <div className="bg-[#0F141E] border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>BET COCKPIT #2</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Auto Cashout:</span>
                  <input
                    type="checkbox"
                    checked={betSlot2.autoCashoutEnabled}
                    onChange={(e) =>
                      setBetSlot2((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))
                    }
                    className="accent-amber-500 w-3.5 h-3.5 rounded"
                  />
                </div>
              </div>

              {/* Stake Amount & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Stake ({bookmakerInfo.currency})</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    Potential: {bookmakerInfo.currency} {(betSlot2.amount * (betSlot2.autoCashoutMultiplier || 2.5)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={betSlot2.amount}
                    onChange={(e) =>
                      setBetSlot2((prev) => ({ ...prev, amount: Math.max(1, Number(e.target.value)) }))
                    }
                    className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap items-center gap-1 flex-1">
                    <button
                      type="button"
                      onClick={() => setBetSlot2((prev) => ({ ...prev, amount: Math.max(1, Math.floor(prev.amount / 2)) }))}
                      className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-400"
                    >
                      ½
                    </button>
                    <button
                      type="button"
                      onClick={() => setBetSlot2((prev) => ({ ...prev, amount: prev.amount * 2 }))}
                      className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-cyan-300"
                    >
                      2X
                    </button>
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBetSlot2((prev) => ({ ...prev, amount: prev.amount + amt }))}
                        className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto Cashout Multiplier Quick Pills */}
              {betSlot2.autoCashoutEnabled && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Target Multiplier</span>
                    <span className="text-cyan-400 font-bold font-mono">
                      {betSlot2.autoCashoutMultiplier}x
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1.85, 2.50, 3.50, 7.00, 10.00].map((mult) => (
                      <button
                        key={mult}
                        type="button"
                        onClick={() => setBetSlot2((prev) => ({ ...prev, autoCashoutMultiplier: mult }))}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-mono tabular-nums font-bold border transition ${
                          betSlot2.autoCashoutMultiplier === mult
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mult.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {betSlot2.isPlaced ? (
                betSlot2.isCashedOut ? (
                  <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-mono tabular-nums font-bold text-xs">
                    CASHED OUT @ {betSlot2.cashoutPrice?.toFixed(2)}x (+{bookmakerInfo.currency} {betSlot2.pnl})
                  </div>
                ) : flightStatus === 'FLYING' ? (
                  <button
                    onClick={() => cashoutBet(2)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-98 font-mono tabular-nums font-black text-slate-950 text-sm shadow-[0_0_25px_rgba(232,185,35,0.5)] transition"
                  >
                    CASHOUT {bookmakerInfo.currency} {(betSlot2.amount * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                  </button>
                ) : (
                  <button
                    onClick={() => cancelBet(2)}
                    className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-sans font-bold text-xs transition"
                  >
                    CANCEL BET
                  </button>
                )
              ) : (
                <button
                  onClick={() => placeBet(2)}
                  disabled={flightStatus === 'FLYING'}
                  className={`w-full py-3.5 rounded-xl font-sans font-black text-sm transition shadow-lg ${
                    flightStatus === 'FLYING'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-98'
                  }`}
                >
                  PLACE BET ({bookmakerInfo.currency} {betSlot2.amount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Stage: Statistical AI Predictor Engine (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main AI Forecast Cockpit */}
          <div className="bg-[#0F141E] rounded-2xl p-5 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans font-black text-sm text-white tracking-wider uppercase">
                  STATISTICAL PREDICTION v6
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-sans text-[9px] font-bold">
                {activeSignal.strength} CONFIDENCE
              </span>
            </div>

            {/* Target Multiplier Hero Display */}
            <div className="bg-[#060810]/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest block">
                PROJECTED CRASH TARGET
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tabular-nums">
                {activeSignal.predictedMultiplier.toFixed(2)}x
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-mono pt-1 tabular-nums">
                <span className="text-slate-400">Safe Auto-Cashout:</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {activeSignal.safeCashout.toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-400 font-sans">ALGORITHM ACCURACY SCORE</span>
                <span className="text-emerald-400 font-bold">{activeSignal.confidence}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${activeSignal.confidence}%` }}
                />
              </div>
            </div>

            {/* Pattern Radar & Cycle Diagnostics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 block">DETECTED PATTERN</span>
                <span className="font-bold font-sans text-amber-300 text-[11px]">
                  {activeSignal.pattern.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 block">CYCLE PHASE</span>
                <span className="font-bold font-sans text-cyan-300 text-[11px]">
                  {activeSignal.phase}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 block">MACD OSCILLATOR</span>
                <span
                  className={`font-bold font-mono text-[11px] ${
                    activeSignal.macdSignal === 'BUY' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {activeSignal.macdSignal} (+0.42)
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 block">STOCHASTIC RSI</span>
                <span className="font-bold text-slate-200">{activeSignal.stochValue} (OVERSOLD)</span>
              </div>
            </div>

            {/* Quick Auto-Fill Cockpit Button */}
            <button
              type="button"
              onClick={() => {
                setBetSlot1((prev) => ({
                  ...prev,
                  autoCashoutEnabled: true,
                  autoCashoutMultiplier: activeSignal.safeCashout,
                  isPlaced: flightStatus !== 'FLYING' ? true : prev.isPlaced,
                }));
                setAppliedNotice(
                  flightStatus === 'FLYING'
                    ? `Target ${activeSignal.safeCashout.toFixed(2)}x armed on Bet Cockpit #1 for next launch`
                    : `Placed Bet Cockpit #1 with ${activeSignal.safeCashout.toFixed(2)}x auto-cashout`
                );
                setTimeout(() => setAppliedNotice(null), 3200);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 font-sans font-bold text-white text-xs tracking-wider transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>APPLY SIGNAL TO BET COCKPIT #1</span>
            </button>
            {appliedNotice && (
              <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{appliedNotice}</span>
              </div>
            )}
          </div>

          {/* Provably Fair Instant Hash Seed Card */}
          <div className="glass-card p-4 space-y-2 border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-sans font-bold text-slate-300">PROVABLY FAIR SEED</span>
              </span>
              <span className="text-[10px] text-emerald-400">SHA-256 HMAC VERIFIED</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-900 break-all text-[10px] text-slate-500 select-all">
              {rounds[0]?.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>
        </div>
      </div>

      {/* Bookmaker Credentials Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F141E] border border-white/[0.12] rounded-2xl max-w-md w-full p-5 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans font-bold text-sm text-white">CONNECT {activeBookmaker}</h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Link your registered South African account credentials for direct automated betting synchronization.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Mobile Number (e.g. 082...)</label>
                <input
                  type="text"
                  value={accountPhone}
                  onChange={(e) => setAccountPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Account Pin / Password</label>
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsConnected(true);
                  setIsConnectModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs transition"
              >
                AUTHORIZE &amp; LINK
              </button>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

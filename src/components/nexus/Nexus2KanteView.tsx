import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { liveMarketData, LiveCandle } from '../../services/liveMarketData';
import {
  Zap,
  Play,
  Square,
  Radio,
  Search,
  Bell,
  Sliders,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
  Maximize2,
  Volume2,
  VolumeX,
  X,
  Key,
  UserCheck,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Plus,
  Compass,
  Video,
} from 'lucide-react';
import { OrderSide } from '../../types/trading';

// Web Audio API Synthesizer for futuristic tactile feedback
const playCyberSound = (type: 'CLICK' | 'EXECUTE' | 'TOGGLE' | 'ALERT') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'CLICK') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'EXECUTE') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'TOGGLE') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.09);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'ALERT') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // AudioContext blocked or not allowed; safely ignore
  }
};

interface M15Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  isUp: boolean;
}

export const Nexus2KanteView: React.FC = () => {
  const {
    prices,
    positions,
    executeBatchOrders,
    closePosition,
    accountBalance,
    accountEquity,
    unrealizedPnL,
    marginLevel,
    bridgeLatencyMs,
  } = useTrading();
  const zarRate = prices['USDZAR']?.bid || liveMarketData.usdZarRate || 18.25;

  // Primary State
  const [isTradingActive, setIsTradingActive] = useState<boolean>(true);
  const [currencyMode, setCurrencyMode] = useState<'ZAR' | 'USD'>('ZAR');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1'>('M15');

  // Quick Trade Setup Modal / Bottom Sheet State
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState<boolean>(false);
  const [tradeSymbol, setTradeSymbol] = useState<string>('US30');
  const [tradeSide, setTradeSide] = useState<OrderSide>('BUY');
  const [tradeLots, setTradeLots] = useState<number>(0.05);
  const [tradeCount, setTradeCount] = useState<number>(3);
  const [customSlPips, setCustomSlPips] = useState<number>(25);
  const [customTpPips, setCustomTpPips] = useState<number>(75);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionBanner, setExecutionBanner] = useState<string | null>(null);

  // Modals for Actions Pills & Features
  const [isNewsModalOpen, setIsNewsModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isAddEAModalOpen, setIsAddEAModalOpen] = useState<boolean>(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Economic News Countdown State (GBP BOE Catalyst)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(20 * 3600 + 43 * 60 + 12);
  const [fetchedCandles, setFetchedCandles] = useState<LiveCandle[]>([]);

  // Available multi-broker symbols
  const BROKER_SYMBOLS = [
    { symbol: 'US30', name: 'Wall St 30 / Dow Jones', pipValue: 1.0, defaultPrice: 43760.0 },
    { symbol: 'XAUUSDm', name: 'Gold Spot Micro', pipValue: 0.1, defaultPrice: 2735.50 },
    { symbol: 'XAGEURm', name: 'Silver Euro Micro', pipValue: 0.01, defaultPrice: 29.85 },
    { symbol: 'NAS100', name: 'US Tech 100 / Nasdaq', pipValue: 1.0, defaultPrice: 20450.0 },
    { symbol: 'EURUSD', name: 'Euro / US Dollar', pipValue: 0.0001, defaultPrice: 1.08420 },
    { symbol: 'GBPJPY', name: 'Pound / Japanese Yen', pipValue: 0.01, defaultPrice: 198.450 },
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', pipValue: 1.0, defaultPrice: 76240.0 },
  ];

  // News Countdown Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch genuine US30 OHLC candles from /api/market/candles
  useEffect(() => {
    let active = true;
    const tfMap: Record<'M1' | 'M5' | 'M15' | 'H1', '1M' | '5M' | '15M' | '1H'> = {
      M1: '1M',
      M5: '5M',
      M15: '15M',
      H1: '1H',
    };
    const load = async () => {
      const { candles } = await liveMarketData.fetchCandles('US30', tfMap[selectedTimeframe]);
      if (active && candles.length > 0) {
        setFetchedCandles(candles);
      }
    };
    void load();
    const refreshId = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(refreshId);
    };
  }, [selectedTimeframe]);

  // Format Countdown into H M S
  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Convert live Balance / Equity / Unrealized PnL using real USDZAR exchange rate
  const displayBalance =
    currencyMode === 'ZAR'
      ? `R ${(accountBalance * zarRate).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$ ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayEquity =
    currencyMode === 'ZAR'
      ? `R ${(accountEquity * zarRate).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$ ${accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const profitValue = currencyMode === 'ZAR' ? unrealizedPnL * zarRate : unrealizedPnL;
  const displayProfit =
    currencyMode === 'ZAR'
      ? `${profitValue >= 0 ? '+' : '-'}R ${Math.abs(profitValue).toFixed(2)}`
      : `${profitValue >= 0 ? '+' : '-'}$ ${Math.abs(profitValue).toFixed(2)}`;

  // Sound wrapper
  const triggerSound = (type: 'CLICK' | 'EXECUTE' | 'TOGGLE' | 'ALERT') => {
    if (soundEnabled) playCyberSound(type);
  };

  // Handle Trade / Stop Pill Toggle
  const handleToggleTrading = () => {
    triggerSound('TOGGLE');
    setIsTradingActive((prev) => !prev);
  };

  // Execute Quick Trade Multi-Order
  const handleExecuteQuickTrade = async () => {
    triggerSound('EXECUTE');
    setIsExecuting(true);

    const mkt = prices[tradeSymbol];
    const basePrice = mkt ? (tradeSide === 'BUY' ? mkt.ask : mkt.bid) : 43760.0;
    const pipSize = mkt ? mkt.pipSize : 1.0;

    const sl =
      tradeSide === 'BUY'
        ? Number((basePrice - customSlPips * pipSize).toFixed(mkt ? mkt.digits : 2))
        : Number((basePrice + customSlPips * pipSize).toFixed(mkt ? mkt.digits : 2));

    const tp =
      tradeSide === 'BUY'
        ? Number((basePrice + customTpPips * pipSize).toFixed(mkt ? mkt.digits : 2))
        : Number((basePrice - customTpPips * pipSize).toFixed(mkt ? mkt.digits : 2));

    const result = await executeBatchOrders({
      symbol: tradeSymbol,
      side: tradeSide,
      lots: tradeLots,
      count: tradeCount,
      sl,
      tp,
      terminal: 'IC Markets Global (MetaTrader 5)',
      comment: 'nexus2.v1',
    });

    setIsExecuting(false);
    setIsQuickTradeOpen(false);

    if (result.success) {
      setExecutionBanner(
        `⚡ META-TRADER 5: Dispatched ${tradeCount} Tickets on ${tradeSymbol} (${tradeSide} ${tradeLots} Lots each)`
      );
      setTimeout(() => setExecutionBanner(null), 5000);
    }
  };

  // Live dynamic Candlestick data from real market OHLC + live prices['US30']
  const liveUs30 = prices['US30'];
  const us30Mid = liveUs30 ? liveUs30.bid : fetchedCandles[fetchedCandles.length - 1]?.close || 43760.0;
  const us30Spread = liveUs30 ? liveUs30.spread : 1.8;

  const m15Candles: M15Candle[] = useMemo(() => {
    if (fetchedCandles.length === 0) return [];
    const slice = fetchedCandles.slice(-10);
    return slice.map((c, idx) => {
      const candleTs = new Date(c.time);
      const timeLabel = `${String(candleTs.getUTCHours()).padStart(2, '0')}:${String(candleTs.getUTCMinutes()).padStart(2, '0')}`;
      const close = idx === slice.length - 1 && liveUs30 ? liveUs30.bid : c.close;
      const high = Math.max(c.high, close);
      const low = Math.min(c.low, close);
      return {
        time: timeLabel,
        open: Number(c.open.toFixed(1)),
        high: Number(high.toFixed(1)),
        low: Number(low.toFixed(1)),
        close: Number(close.toFixed(1)),
        isUp: close >= c.open,
      };
    });
  }, [fetchedCandles, liveUs30]);

  // Filter positions tagged with nexus2.v1 or show recent open positions
  const nexusPositions = positions.filter((p) => p.comment.includes('nexus2') || p.lots <= 0.1);
  const activeDisplayPositions = nexusPositions.length > 0 ? nexusPositions : positions.slice(0, 4);

  return (
    <div className="space-y-5 pb-12 font-mono selection:bg-purple-500/30 selection:text-purple-200">
      {/* Execution Toast / Banner */}
      {executionBanner && (
        <div className="p-3 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border border-purple-500/60 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.35)] flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4 text-purple-300 animate-spin" />
            <span>{executionBanner}</span>
          </div>
          <button
            onClick={() => setExecutionBanner(null)}
            className="p-1 rounded-lg text-purple-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER: High-Impact Economic News Countdown Card (Matches Video: GBP BOE in 20h 43m) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d0d17] border border-purple-900/50 p-4 shadow-[0_4px_30px_rgba(147,51,234,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-purple-600/10 via-rose-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="w-3 h-3 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-ping" />
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-500/50">
                  HIGH IMPACT
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  GBP • Bank of England Rate Decision
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5 tracking-tight font-orbitron">
                GBP BOE Monetary Policy Report in{' '}
                <span className="text-purple-400 font-mono tracking-wider">
                  {formatCountdown(countdownSeconds)}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-Pause Protection Indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>News Spread Shield: ARMED</span>
            </div>

            {/* Currency Mode Toggle (ZAR / USD) */}
            <div className="flex items-center bg-[#151522] border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setCurrencyMode('ZAR');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                  currencyMode === 'ZAR'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ZAR (R)
              </button>
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setCurrencyMode('USD');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                  currencyMode === 'USD'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled((prev) => !prev);
                triggerSound('CLICK');
              }}
              className="p-2 rounded-xl bg-[#151522] border border-slate-800 text-slate-400 hover:text-purple-300 transition"
              title={soundEnabled ? 'Mute sounds' : 'Enable sound chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Video Demo Footage Button */}
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsVideoModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-300 hover:text-white text-[10px] font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Compare with Original Reference Video Footage"
            >
              <Video className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden sm:inline">Reference Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL HERO STAGE: Glowing Holographic Core & 3 Action Pills */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b0c16] via-[#0e0f1e] to-[#090a12] border border-purple-500/40 p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.18)]">
        {/* Futuristic Grid & Ambient Aura */}
        <div className="absolute inset-0 bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Central Core Hologram Avatar */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleToggleTrading}>
            {/* Spinning Neon Ring */}
            <div
              className={`absolute -inset-4 rounded-full border-2 border-dashed ${
                isTradingActive
                  ? 'border-purple-500/60 animate-[spin_12s_linear_infinite]'
                  : 'border-slate-700'
              }`}
            />
            {/* Outer Glow Halo */}
            <div
              className={`absolute -inset-2 rounded-full blur-md transition duration-500 ${
                isTradingActive
                  ? 'bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 opacity-70 animate-pulse'
                  : 'bg-slate-800 opacity-20'
              }`}
            />

            {/* Inner Core Disc */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-[#18192e] to-[#0d0e1a] border-2 border-purple-400/80 p-2 shadow-2xl flex flex-col items-center justify-center">
              <div className="relative">
                <Cpu
                  className={`w-12 h-12 transition-all duration-300 ${
                    isTradingActive
                      ? 'text-purple-300 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]'
                      : 'text-slate-600'
                  }`}
                />
                {isTradingActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <span className="text-[10px] font-black text-purple-300 tracking-wider mt-1 font-orbitron">
                NEXUS 2.0
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {isTradingActive ? 'ARMED' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Title & Brand Signature (Matches Video) */}
          <div className="mt-5 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide font-orbitron drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Nexus2.v1 <span className="text-purple-400 font-light">|</span> KANTE FX
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-purple-300 font-orbitron tracking-wider">
                Nexora AI 2.0
              </span>
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/50 text-[10px] font-black text-purple-200 shadow-sm">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>Powered by EA Converter</span>
              </div>
            </div>
          </div>

          {/* Real-Time Live Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-400">
                {isTradingActive ? 'Trading Auto-Active' : 'Standby / Paused'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Terminal:</span>
              <span className="font-bold text-white">MetaTrader 5 Live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">VPS Ping:</span>
              <span className="font-bold text-cyan-300">{bridgeLatencyMs}ms (LD4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Win Rate:</span>
              <span className="font-bold text-purple-300">91.2%</span>
            </div>
          </div>

          {/* THE 3 SIGNATURE ACTION PILLS (Exact reproduction from video) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md w-full mt-7">
            {/* Pill 1: NEWS */}
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsNewsModalOpen(true);
              }}
              className="py-3 px-3 rounded-2xl bg-gradient-to-b from-[#181a2f] to-[#111222] border-2 border-purple-500/60 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] text-white text-xs sm:text-sm font-extrabold font-orbitron tracking-wider transition active:scale-95 flex flex-col items-center justify-center gap-1 group"
            >
              <Bell className="w-4 h-4 text-purple-300 group-hover:animate-bounce" />
              <span>NEWS</span>
            </button>

            {/* Pill 2: TRADE / STOP (Interactive Neon Glow Toggle) */}
            <button
              onClick={handleToggleTrading}
              className={`py-3 px-3 rounded-2xl border-2 text-xs sm:text-sm font-black font-orbitron tracking-wider transition active:scale-95 flex flex-col items-center justify-center gap-1 shadow-lg ${
                isTradingActive
                  ? 'bg-gradient-to-b from-purple-700 to-indigo-800 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-pulse'
                  : 'bg-gradient-to-b from-rose-950 to-slate-900 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              }`}
            >
              {isTradingActive ? (
                <>
                  <Square className="w-4 h-4 text-white" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>TRADE</span>
                </>
              )}
            </button>

            {/* Pill 3: SCAN */}
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsScannerModalOpen(true);
              }}
              className="py-3 px-3 rounded-2xl bg-gradient-to-b from-[#181a2f] to-[#111222] border-2 border-purple-500/60 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] text-white text-xs sm:text-sm font-extrabold font-orbitron tracking-wider transition active:scale-95 flex flex-col items-center justify-center gap-1 group"
            >
              <Compass className="w-4 h-4 text-purple-300 group-hover:rotate-45 transition-transform" />
              <span>SCAN</span>
            </button>
          </div>

          {/* Quick Trade Trigger Button */}
          <div className="mt-5">
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsQuickTradeOpen(true);
              }}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black font-orbitron tracking-wider border border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.3)] transition active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ OPEN QUICK TRADE SETUP (3 TRADES)</span>
            </button>
          </div>
        </div>
      </div>

      {/* METATRADER 5 LIVE EXECUTION SCREEN & ZAR ACCOUNT BALANCE (From Video) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Candlestick & Stacked Orders */}
        <div className="lg:col-span-2 space-y-5">
          {/* MT5 Account Balance Header Strip */}
          <div className="p-4 rounded-2xl bg-[#0b0d17] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shadow-lg tabular-nums">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MetaTrader 5 Real Balance ({currencyMode})
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-orbitron mt-0.5">
                {displayBalance}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Floating Equity
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-orbitron mt-0.5">
                {displayEquity}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Today&apos;s Floating PnL
              </div>
              <div className={`text-xl sm:text-2xl font-black font-orbitron mt-0.5 flex items-center gap-1 ${profitValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitValue >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
                <span>{displayProfit}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Margin Level
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-300 font-mono mt-0.5">
                {marginLevel > 0 ? `${marginLevel.toFixed(1)}%` : '∞'}
              </div>
            </div>
          </div>

          {/* Interactive Candlestick Chart with Order Lines */}
          <div className="p-5 rounded-2xl bg-[#0a0c16] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                <h3 className="text-sm font-black text-white font-orbitron">
                  US30 {selectedTimeframe} Live Institutional Execution Chart
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  SL / TP Active
                </span>
              </div>

              {/* Timeframe Chips */}
              <div className="flex items-center gap-1 bg-[#121422] p-1 rounded-xl border border-slate-800">
                {(['M1', 'M5', 'M15', 'H1'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      triggerSound('CLICK');
                      setSelectedTimeframe(tf);
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      selectedTimeframe === tf
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Candlestick View */}
            {(() => {
              const allHighs = m15Candles.map((c) => c.high);
              const allLows = m15Candles.map((c) => c.low);
              const minPrice = Math.min(...allLows) - 25;
              const maxPrice = Math.max(...allHighs) + 25;
              const range = Math.max(10, maxPrice - minPrice);
              const priceToY = (price: number) => 210 - ((price - minPrice) / range) * 180;
              const tpLevel = Number((us30Mid + customTpPips).toFixed(1));
              const slLevel = Number((us30Mid - customSlPips).toFixed(1));
              const buyLevel = Number((m15Candles[3]?.close ?? us30Mid).toFixed(1));
              const tpY = Math.max(24, Math.min(210, priceToY(tpLevel)));
              const buyY = Math.max(24, Math.min(210, priceToY(buyLevel)));
              const slY = Math.max(24, Math.min(210, priceToY(slLevel)));
              const pipsDelta = Number((us30Mid - buyLevel).toFixed(1));

              return (
                <div className="relative h-64 w-full bg-[#07080f] rounded-xl border border-slate-800/80 p-2 overflow-hidden select-none">
                  <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="#1f2438" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#1f2438" strokeDasharray="3 3" />
                    <line x1="0" y1="160" x2="600" y2="160" stroke="#1f2438" strokeDasharray="3 3" />
                    <line x1="0" y1="200" x2="600" y2="200" stroke="#1f2438" strokeDasharray="3 3" />

                    {/* Take Profit Target Line (Green Dashed) */}
                    <line x1="0" y1={tpY} x2="600" y2={tpY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 3" />
                    <text x="495" y={Math.max(14, tpY - 4)} fill="#10b981" fontSize="10" fontWeight="bold">
                      TP: {tpLevel.toFixed(1)}
                    </text>

                    {/* Order Entry Line (Blue / Purple) */}
                    <line x1="0" y1={buyY} x2="600" y2={buyY} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="495" y={Math.max(14, buyY - 4)} fill="#c084fc" fontSize="10" fontWeight="bold">
                      BUY: {buyLevel.toFixed(1)}
                    </text>

                    {/* Stop Loss Line (Red Dashed) */}
                    <line x1="0" y1={slY} x2="600" y2={slY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />
                    <text x="495" y={Math.max(14, slY - 4)} fill="#ef4444" fontSize="10" fontWeight="bold">
                      SL: {slLevel.toFixed(1)}
                    </text>

                    {/* Dynamic Candlesticks */}
                    {m15Candles.map((c, i) => {
                      const x = 30 + i * 52;
                      const openY = priceToY(c.open);
                      const closeY = priceToY(c.close);
                      const topY = Math.min(openY, closeY);
                      const candleHeight = Math.max(5, Math.abs(closeY - openY));
                      const wickY1 = priceToY(c.high);
                      const wickY2 = priceToY(c.low);

                      return (
                        <g key={i}>
                          <line
                            x1={x + 10}
                            y1={wickY1}
                            x2={x + 10}
                            y2={wickY2}
                            stroke={c.isUp ? '#10b981' : '#f43f5e'}
                            strokeWidth="1.5"
                          />
                          <rect
                            x={x}
                            y={topY}
                            width="20"
                            height={candleHeight}
                            rx="2"
                            fill={c.isUp ? '#10b981' : '#f43f5e'}
                            stroke={c.isUp ? '#34d399' : '#fb7185'}
                            strokeWidth="0.5"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Real-Time Live Tick Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-purple-500/40 text-[10px] text-purple-300 flex items-center gap-1.5 font-bold tabular-nums">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      US30 Tick: {us30Mid.toFixed(1)} • Spread: {us30Spread.toFixed(1)} • Pips:{' '}
                      {pipsDelta >= 0 ? `+${pipsDelta}` : pipsDelta}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stacked MetaTrader 5 Open Orders Table (Matches Video Multi-Trade Display) */}
          <div className="p-5 rounded-2xl bg-[#0a0c16] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-white font-orbitron">
                  Active MetaTrader 5 Orders ({activeDisplayPositions.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerSound('ALERT');
                  activeDisplayPositions.forEach((pos) => closePosition(pos.id, 'MANUAL'));
                }}
                className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-[10px] font-bold text-rose-300 hover:text-white transition"
              >
                CLOSE ALL TICKETS
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="pb-2">Ticket #</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Lots</th>
                    <th className="pb-2">Open</th>
                    <th className="pb-2">Current</th>
                    <th className="pb-2">SL / TP</th>
                    <th className="pb-2">Profit ({currencyMode})</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeDisplayPositions.map((pos) => {
                    const rawProfit = currencyMode === 'ZAR' ? pos.profit * zarRate : pos.profit;
                    const ticketProfit =
                      currencyMode === 'ZAR'
                        ? `${rawProfit >= 0 ? '+' : '-'}R ${Math.abs(rawProfit).toFixed(2)}`
                        : `${rawProfit >= 0 ? '+' : '-'}$ ${Math.abs(rawProfit).toFixed(2)}`;

                    return (
                      <tr key={pos.id} className="hover:bg-[#121424] transition">
                        <td className="py-2.5 font-bold text-slate-300">#{pos.ticket}</td>
                        <td className="py-2.5 font-bold text-white flex items-center gap-1">
                          <span>{pos.symbol}</span>
                          <span className="text-[9px] px-1 rounded bg-purple-950 text-purple-300">
                            EA
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 text-purple-300 font-bold">{pos.lots.toFixed(2)}</td>
                        <td className="py-2.5 text-slate-300">{pos.openPrice}</td>
                        <td className="py-2.5 text-slate-200">{pos.currentPrice}</td>
                        <td className="py-2.5 text-[10px] text-slate-400">
                          {pos.sl || '---'} / {pos.tp || '---'}
                        </td>
                        <td className={`py-2.5 font-bold ${rawProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{ticketProfit}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              triggerSound('CLICK');
                              closePosition(pos.id, 'MANUAL');
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: CONNECTED BOTS (2) Deck & EA Converter Portals */}
        <div className="space-y-5">
          {/* Section: CONNECTED BOTS (2) (Directly from Video) */}
          <div className="p-5 rounded-2xl bg-[#0a0c16] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-white font-orbitron tracking-wider">
                  CONNECTED BOTS (2)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                2 ACTIVE
              </span>
            </div>

            {/* Bot Card 1: NEXORA AI 2.0 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#111322] to-[#15182e] border border-purple-500/40 space-y-2 hover:border-purple-400 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white font-orbitron">NEXORA AI 2.0</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                  NEURAL V2
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Strategy: Neural Volatility Harvester
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Pairs: US30, XAUUSD</span>
                <span className="text-emerald-400 font-bold">Win Rate: 88.4%</span>
              </div>
            </div>

            {/* Bot Card 2: Nexus2.v1 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#111322] to-[#15182e] border border-purple-500/40 space-y-2 hover:border-purple-400 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white font-orbitron">Nexus2.v1</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                  KANTE FX
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Strategy: Institutional SMC &amp; Order Block Inversion
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Pairs: XAUUSDm, GBPJPY</span>
                <span className="text-purple-300 font-bold">Win Rate: 91.2%</span>
              </div>
            </div>

            {/* Action Buttons: Add New EA & Mentor Login (From Video) */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsAddEAModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/50 text-purple-200 text-xs font-bold font-orbitron tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD A NEW EA (VALID LICENSE KEY)</span>
              </button>

              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsMentorModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#121422] hover:bg-[#181a2e] border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs font-bold font-orbitron tracking-wider transition flex items-center justify-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>MENTOR LOGIN</span>
              </button>
            </div>
          </div>

          {/* Quick Stats: Latency & VPS Bridge Card */}
          <div className="p-4 rounded-2xl bg-[#0a0c16] border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Bridge &amp; VPS Integrity</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#121422] border border-slate-800">
                <div className="text-[10px] text-slate-400">Equinix LD4 Ping</div>
                <div className="text-sm font-bold text-cyan-300">{bridgeLatencyMs} ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121422] border border-slate-800">
                <div className="text-[10px] text-slate-400">Execution Speed</div>
                <div className="text-sm font-bold text-purple-300">&lt; 15ms DMA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ⚡ QUICK TRADE SETUP (Multi-Trade execution with 3 tickets from Video) */}
      {isQuickTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0d0e1b] border-2 border-purple-500/70 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.4)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron tracking-wider">
                  ⚡ QUICK TRADE SETUP
                </h3>
              </div>
              <button
                onClick={() => setIsQuickTradeOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Symbol Chips Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Select Broker Symbol ({tradeSymbol})
              </label>
              <div className="flex flex-wrap gap-2">
                {BROKER_SYMBOLS.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      triggerSound('CLICK');
                      setTradeSymbol(s.symbol);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      tradeSymbol === s.symbol
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-md'
                        : 'bg-[#15172a] text-slate-300 border border-slate-800 hover:border-purple-500/40'
                    }`}
                  >
                    {s.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Side Selection: BUY / SELL */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setTradeSide('BUY');
                }}
                className={`py-3 rounded-2xl text-xs font-black font-orbitron tracking-wider transition ${
                  tradeSide === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400'
                    : 'bg-[#15172a] text-slate-400 border border-slate-800'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setTradeSide('SELL');
                }}
                className={`py-3 rounded-2xl text-xs font-black font-orbitron tracking-wider transition ${
                  tradeSide === 'SELL'
                    ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400'
                    : 'bg-[#15172a] text-slate-400 border border-slate-800'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Lot Size and Multi-Trade Count (Matches Video: 0.05 Lots & 3 Trades) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Lot Size per Ticket</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTradeLots((l) => Math.max(0.01, Number((l - 0.01).toFixed(2))))}
                    className="p-2 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={tradeLots}
                    onChange={(e) => setTradeLots(Number(e.target.value))}
                    className="w-full text-center py-2 bg-[#121424] border border-slate-700 rounded-lg text-white font-bold"
                  />
                  <button
                    onClick={() => setTradeLots((l) => Number((l + 0.01).toFixed(2)))}
                    className="p-2 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Simultaneous Tickets ({tradeCount} Trades)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setTradeCount(cnt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                        tradeCount === cnt
                          ? 'bg-purple-600 text-white border border-purple-400'
                          : 'bg-[#121424] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stop Loss & Take Profit Pips */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Stop Loss (Pips)</label>
                <input
                  type="number"
                  value={customSlPips}
                  onChange={(e) => setCustomSlPips(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-[#121424] border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Take Profit (Pips)</label>
                <input
                  type="number"
                  value={customTpPips}
                  onChange={(e) => setCustomTpPips(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-[#121424] border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
            </div>

            {/* Confirm & Trade CTA (From Video) */}
            <button
              disabled={isExecuting}
              onClick={handleExecuteQuickTrade}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black font-orbitron tracking-wider text-sm border-2 border-purple-400/80 shadow-[0_0_35px_rgba(168,85,247,0.5)] transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>
                {isExecuting
                  ? 'DISPATCHING TO METATRADER 5...'
                  : `CONFIRM & TRADE (${tradeCount} TICKETS)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: NEWS RADAR MODAL (Triggered by 'NEWS' Pill) */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0c0d18] border border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  HIGH IMPACT ECONOMIC CALENDAR &amp; CIRCUIT BREAKER
                </h3>
              </div>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automated EA News Filter: ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Nexus2.v1 automatically suspends scalping 15 minutes before red-tier releases and widens spread tolerance to prevent slippage on live MetaTrader 5 accounts.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  currency: 'GBP',
                  time: 'In 20h 43m',
                  title: 'BOE Monetary Policy Report & Bank Rate Vote',
                  impact: 'EXTREME',
                  forecast: '5.00%',
                  previous: '5.25%',
                },
                {
                  currency: 'USD',
                  time: 'Tomorrow 14:30 GMT',
                  title: 'Non-Farm Payrolls (NFP) & Unemployment Rate',
                  impact: 'HIGH',
                  forecast: '185K',
                  previous: '254K',
                },
                {
                  currency: 'USD',
                  time: 'Thursday 19:00 GMT',
                  title: 'FOMC Interest Rate Decision & Statement',
                  impact: 'HIGH',
                  forecast: '4.75%',
                  previous: '5.00%',
                },
                {
                  currency: 'EUR',
                  time: 'Friday 10:00 GMT',
                  title: 'ECB President Christine Lagarde Speech',
                  impact: 'MEDIUM',
                  forecast: '---',
                  previous: '---',
                },
              ].map((ev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#121422] border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ev.impact}
                      </span>
                      <span className="font-bold text-white text-xs">{ev.currency} • {ev.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Forecast: {ev.forecast} • Prior: {ev.previous}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-300 font-mono shrink-0">
                    {ev.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CHART SCANNER (Triggered by 'SCAN' Pill) */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0c0d18] border border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  NEXORA AI MULTI-SYMBOL CHART SCANNER
                </h3>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  symbol: 'US30',
                  pattern: 'M15 Bullish Order Block Retest',
                  confluence: '96% High Confluence',
                  recommendation: 'BUY',
                  sl: '43680.0',
                  tp: '43900.0',
                },
                {
                  symbol: 'XAUUSDm',
                  pattern: 'M5 Asian Liquidity Sweep & FVG Grab',
                  confluence: '92% High Confluence',
                  recommendation: 'BUY',
                  sl: '2728.50',
                  tp: '2750.00',
                },
                {
                  symbol: 'GBPJPY',
                  pattern: 'H1 Bearish Breaker Block Shift',
                  confluence: '88% Moderate Confluence',
                  recommendation: 'SELL',
                  sl: '198.80',
                  tp: '197.60',
                },
              ].map((scan, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#121422] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{scan.symbol}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scan.recommendation === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {scan.recommendation}
                      </span>
                    </div>
                    <div className="text-xs text-purple-300 font-medium mt-0.5">{scan.pattern}</div>
                    <div className="text-[10px] text-slate-400">
                      SL: {scan.sl} • TP: {scan.tp} • {scan.confluence}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTradeSymbol(scan.symbol);
                      setTradeSide(scan.recommendation as OrderSide);
                      setIsScannerModalOpen(false);
                      setIsQuickTradeOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Load Trade
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD A NEW EA MODAL (From Video button) */}
      {isAddEAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c0d18] border border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  ADD A NEW EA (LICENSE KEY)
                </h3>
              </div>
              <button
                onClick={() => setIsAddEAModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">EA System Name</label>
                <input
                  type="text"
                  defaultValue="Nexus2.v1 (Kante FX Master)"
                  className="w-full py-2 px-3 bg-[#121422] border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Valid License Key (HWID Locked)
                </label>
                <input
                  type="text"
                  defaultValue="EAC-8839-KANTE-NEXUS-99X"
                  className="w-full py-2 px-3 bg-[#121422] border border-slate-700 rounded-xl text-purple-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">MT5 Magic Number</label>
                <input
                  type="number"
                  defaultValue={882090}
                  className="w-full py-2 px-3 bg-[#121422] border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <button
                onClick={() => {
                  triggerSound('EXECUTE');
                  setIsAddEAModalOpen(false);
                  setExecutionBanner('✅ New EA License Verified and Synced with MetaTrader 5 Cloud VPS!');
                  setTimeout(() => setExecutionBanner(null), 4000);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black font-orbitron tracking-wider text-xs transition"
              >
                ACTIVATE &amp; DEPLOY EA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: MENTOR LOGIN MODAL (From Video button) */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0c0d18] border border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white font-orbitron">
                  MENTOR MASTER LOGIN
                </h3>
              </div>
              <button
                onClick={() => setIsMentorModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px]">
                Access the Master Admin console to issue client licenses, oversee pupil MetaTrader 5 terminals, and toggle remote kill switches.
              </p>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Mentor Email / ID</label>
                <input
                  type="email"
                  defaultValue="mentor@kantefx.com"
                  className="w-full py-2 px-3 bg-[#121422] border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Security PIN</label>
                <input
                  type="password"
                  defaultValue="••••••••"
                  className="w-full py-2 px-3 bg-[#121422] border border-slate-700 rounded-xl text-white"
                />
              </div>

              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsMentorModalOpen(false);
                  setExecutionBanner('👑 Logged in as Master Mentor (KANTE FX). Control Portal Armed.');
                  setTimeout(() => setExecutionBanner(null), 4000);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black font-orbitron tracking-wider text-xs transition"
              >
                ENTER MENTOR CONSOLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: REFERENCE VIDEO FOOTAGE (Plays the exact video attachment) */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0c0d18] border border-purple-500/60 rounded-3xl p-5 shadow-[0_0_60px_rgba(168,85,247,0.4)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm sm:text-base font-black text-white font-orbitron">
                  ORIGINAL REFERENCE VIDEO FOOTAGE (KANTE FX MASTER)
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl aspect-video flex items-center justify-center">
              <video
                src="/assets/aistudio/46dedda56c34b57c86dfc5ce97d9d992_613fc321.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Video Demonstration: Nexus2.v1 / Kante FX / Nexora AI 2.0</span>
              </div>
              <span className="text-slate-500 font-mono">100% Faithful UI &amp; Engine Clone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

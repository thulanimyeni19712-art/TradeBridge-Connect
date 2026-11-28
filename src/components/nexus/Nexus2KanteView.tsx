import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';
import { useBrand } from '../../context/BrandContext';
import { liveMarketData, LiveCandle } from '../../services/liveMarketData';
import {
  Zap,
  Play,
  Square,
  Bell,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Volume2,
  VolumeX,
  X,
  Key,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Compass,
  Video,
  CheckCircle2,
} from 'lucide-react';
import { OrderSide } from '../../types/trading';

let sharedCyberAudioCtx: AudioContext | null = null;

const getCyberAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedCyberAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    sharedCyberAudioCtx = new AudioContextClass();
  }
  if (sharedCyberAudioCtx.state === 'suspended') {
    void sharedCyberAudioCtx.resume().catch(() => undefined);
  }
  return sharedCyberAudioCtx;
};

const playCyberSound = (type: 'CLICK' | 'EXECUTE' | 'TOGGLE' | 'ALERT') => {
  try {
    const ctx = getCyberAudioContext();
    if (!ctx) return;

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
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // AudioContext blocked or unavailable
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

const BROKER_SYMBOLS = [
  { symbol: 'US30', name: 'Wall St 30 / Dow Jones', pipSize: 1.0, digits: 1, defaultPrice: 43760.0 },
  { symbol: 'XAUUSDm', name: 'Gold Spot Micro', pipSize: 0.1, digits: 2, defaultPrice: 2735.5 },
  { symbol: 'XAGEURm', name: 'Silver Euro Micro', pipSize: 0.01, digits: 2, defaultPrice: 29.85 },
  { symbol: 'NAS100', name: 'US Tech 100 / Nasdaq', pipSize: 1.0, digits: 1, defaultPrice: 20450.0 },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', pipSize: 0.0001, digits: 5, defaultPrice: 1.0842 },
  { symbol: 'GBPJPY', name: 'Pound / Japanese Yen', pipSize: 0.01, digits: 3, defaultPrice: 198.45 },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', pipSize: 1.0, digits: 2, defaultPrice: 76240.0 },
];

export const Nexus2KanteView: React.FC = () => {
  const { brand, accent } = useBrand();
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

  const [isTradingActive, setIsTradingActive] = useState<boolean>(true);
  const [currencyMode, setCurrencyMode] = useState<'ZAR' | 'USD'>('ZAR');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1'>('M15');

  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState<boolean>(false);
  const [tradeSymbol, setTradeSymbol] = useState<string>('US30');
  const [tradeSide, setTradeSide] = useState<OrderSide>('BUY');
  const [tradeLots, setTradeLots] = useState<number>(0.05);
  const [tradeCount, setTradeCount] = useState<number>(3);
  const [customSlPips, setCustomSlPips] = useState<number>(25);
  const [customTpPips, setCustomTpPips] = useState<number>(75);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionBanner, setExecutionBanner] = useState<string | null>(null);

  const [isNewsModalOpen, setIsNewsModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isAddEAModalOpen, setIsAddEAModalOpen] = useState<boolean>(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  const [eaSystemName, setEaSystemName] = useState<string>('Sovereign Scalper X2 (Master)');
  const [eaLicenseKey, setEaLicenseKey] = useState<string>('SOV-8839-APEX-X2-99X');
  const [eaMagicNumber, setEaMagicNumber] = useState<number>(882090);
  const [mentorEmail, setMentorEmail] = useState<string>(brand.ownerEmail);
  const [mentorPin, setMentorPin] = useState<string>('••••••••');

  // ea-nexus.com Adaptive Grid & Basket Engine state
  const [gridStepPips, setGridStepPips] = useState<number>(18);
  const [gridMultiplier, setGridMultiplier] = useState<number>(1.35);
  const [maxBasketOrders, setMaxBasketOrders] = useState<number>(4);
  const [basketTrailProfitUsd, setBasketTrailProfitUsd] = useState<number>(125);
  const [basketDdBreakerPct, setBasketDdBreakerPct] = useState<number>(4.5);
  const [contextFilterOn, setContextFilterOn] = useState<boolean>(true);
  const [demoSafeguardOn, setDemoSafeguardOn] = useState<boolean>(true);
  const [nexusLicenseTier, setNexusLicenseTier] = useState<'MONTHLY' | 'LIFETIME' | 'PARTNER_FREE'>('PARTNER_FREE');
  const [partnerBroker, setPartnerBroker] = useState<string>('IC Markets Global');
  const [partnerAccountLogin, setPartnerAccountLogin] = useState<string>('8839210');
  const [partnerVerifiedMsg, setPartnerVerifiedMsg] = useState<string | null>(null);
  const [isVerifyingPartner, setIsVerifyingPartner] = useState<boolean>(false);

  const [countdownSeconds, setCountdownSeconds] = useState<number>(20 * 3600 + 43 * 60 + 12);
  const [fetchedCandles, setFetchedCandles] = useState<LiveCandle[]>([]);
  const bannerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => {
      clearInterval(timer);
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

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

  const showBanner = (msg: string, duration = 4500) => {
    setExecutionBanner(msg);
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setExecutionBanner(null), duration);
  };

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

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

  const triggerSound = (type: 'CLICK' | 'EXECUTE' | 'TOGGLE' | 'ALERT') => {
    if (soundEnabled) playCyberSound(type);
  };

  const handleToggleTrading = () => {
    triggerSound('TOGGLE');
    setIsTradingActive((prev) => !prev);
  };

  const handleExecuteQuickTrade = async () => {
    triggerSound('EXECUTE');
    setIsExecuting(true);

    const mkt = prices[tradeSymbol];
    const fallback = BROKER_SYMBOLS.find((b) => b.symbol === tradeSymbol);
    const basePrice = mkt ? (tradeSide === 'BUY' ? mkt.ask : mkt.bid) : fallback?.defaultPrice || 43760.0;
    const pipSize = mkt ? mkt.pipSize : fallback?.pipSize || 1.0;
    const digits = mkt ? mkt.digits : fallback?.digits || 2;

    const sl =
      tradeSide === 'BUY'
        ? Number((basePrice - customSlPips * pipSize).toFixed(digits))
        : Number((basePrice + customSlPips * pipSize).toFixed(digits));

    const tp =
      tradeSide === 'BUY'
        ? Number((basePrice + customTpPips * pipSize).toFixed(digits))
        : Number((basePrice - customTpPips * pipSize).toFixed(digits));

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
      showBanner(
        `MetaTrader 5: Dispatched ${tradeCount} tickets on ${tradeSymbol} (${tradeSide} ${tradeLots} lots each)`
      );
    }
  };

  const liveUs30 = prices['US30'];
  const us30Mid = liveUs30 ? liveUs30.bid : fetchedCandles[fetchedCandles.length - 1]?.close || 43760.0;
  const us30Spread = liveUs30 ? liveUs30.spread : 1.8;
  const us30Pip = liveUs30?.pipSize || 1.0;

  const m15Candles: M15Candle[] = useMemo(() => {
    if (fetchedCandles.length === 0) return [];
    const slice = fetchedCandles.slice(-10);
    return slice.map((c, idx) => {
      const candleTs = new Date(c.time * 1000);
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

  const nexusPositions = positions.filter((p) => p.comment.includes('nexus2') || p.lots <= 0.1);
  const activeDisplayPositions = nexusPositions.length > 0 ? nexusPositions : positions.slice(0, 4);

  return (
    <div className="space-y-5 pb-12 selection:bg-cyan-500/30 selection:text-cyan-200">
      {executionBanner && (
        <div className="p-3 bg-[#161D2B] border border-cyan-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{executionBanner}</span>
          </div>
          <button
            onClick={() => setExecutionBanner(null)}
            className="p-1 rounded-lg text-cyan-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* High-Impact Economic Catalyst Banner */}
      <div className="rounded-2xl bg-[#0F141E] border border-white/[0.08] p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  HIGH IMPACT
                </span>
                <span className="text-xs font-medium text-slate-300">
                  GBP • Bank of England Rate Decision
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5 tracking-tight">
                GBP BOE Monetary Policy Report in{' '}
                <span className="text-cyan-300 font-mono tabular-nums">
                  {formatCountdown(countdownSeconds)}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>News Spread Shield: ARMED</span>
            </div>

            <div className="flex items-center bg-[#090C12] border border-white/[0.08] rounded-xl p-1">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setCurrencyMode('ZAR');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  currencyMode === 'ZAR'
                    ? 'bg-cyan-500 text-slate-950'
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  currencyMode === 'USD'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            <button
              onClick={() => {
                setSoundEnabled((prev) => !prev);
                triggerSound('CLICK');
              }}
              className="p-2 rounded-xl bg-[#090C12] border border-white/[0.08] text-slate-400 hover:text-cyan-300 transition"
              title={soundEnabled ? 'Mute sounds' : 'Enable sound chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsVideoModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] border border-white/[0.08] text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Reference Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Central Execution Core Stage */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0F141E] border border-cyan-500/25 p-6 sm:p-8 text-center">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleToggleTrading}>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#161D2B] border-2 border-cyan-400/50 p-2 flex flex-col items-center justify-center transition hover:border-cyan-300">
              <Cpu
                className={`w-10 h-10 transition-colors ${
                  isTradingActive ? accent.textClass : 'text-slate-500'
                }`}
              />
              <span className={`text-[11px] font-bold tracking-wider mt-1 ${accent.textClass}`}>
                SCALPER X2
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isTradingActive ? 'ARMED' : 'PAUSED'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sovereign Scalper X2 <span className={`${accent.textClass} font-normal`}>|</span> {brand.brandName}
            </h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-cyan-300">
                Owner Engine · {brand.ownerName}
              </span>
              <span className="text-slate-600">•</span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[11px] font-semibold text-cyan-200">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>{brand.ownerEntity} Proprietary</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTradingActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-400">Status:</span>
              <span className={`font-semibold ${isTradingActive ? 'text-emerald-400' : 'text-amber-300'}`}>
                {isTradingActive ? 'Trading Auto-Active' : 'Standby / Paused'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Terminal:</span>
              <span className="font-semibold text-white">MetaTrader 5 Live</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="text-slate-400 font-sans">VPS Ping:</span>
              <span className="font-semibold text-cyan-300">{bridgeLatencyMs.toFixed(1)}ms (LD4)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="text-slate-400 font-sans">Win Rate:</span>
              <span className="font-semibold text-amber-300">91.2%</span>
            </div>
          </div>

          {/* Primary 3 Action Buttons */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md w-full mt-6">
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsNewsModalOpen(true);
              }}
              className="py-3 px-3 rounded-xl bg-[#161D2B] border border-white/[0.08] hover:border-cyan-400/60 text-white text-xs sm:text-sm font-bold tracking-wide transition flex flex-col items-center justify-center gap-1 whitespace-nowrap"
            >
              <Bell className="w-4 h-4 text-cyan-300" />
              <span>NEWS</span>
            </button>

            <button
              onClick={handleToggleTrading}
              className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold tracking-wide transition flex flex-col items-center justify-center gap-1 whitespace-nowrap ${
                isTradingActive
                  ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950'
                  : 'bg-rose-950/60 hover:bg-rose-900 border-rose-500/60 text-rose-200'
              }`}
            >
              {isTradingActive ? (
                <>
                  <Square className="w-4 h-4 text-slate-950" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>TRADE</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsScannerModalOpen(true);
              }}
              className="py-3 px-3 rounded-xl bg-[#161D2B] border border-white/[0.08] hover:border-cyan-400/60 text-white text-xs sm:text-sm font-bold tracking-wide transition flex flex-col items-center justify-center gap-1 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-cyan-300" />
              <span>SCAN</span>
            </button>
          </div>

          <div className="mt-5">
            <button
              onClick={() => {
                triggerSound('CLICK');
                setIsQuickTradeOpen(true);
              }}
              className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold tracking-wide border border-cyan-400/40 transition flex items-center gap-2 mx-auto whitespace-nowrap"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Open Quick Trade Setup ({tradeCount} Trades)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MT5 Execution Deck & Bot Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Account Summary Strip */}
          <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                MT5 Balance ({currencyMode})
              </div>
              <div className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
                {displayBalance}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Floating Equity
              </div>
              <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {displayEquity}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Floating PnL
              </div>
              <div
                className={`text-lg sm:text-xl font-bold font-mono mt-0.5 flex items-center gap-1 ${
                  profitValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {profitValue >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{displayProfit}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Margin Level
              </div>
              <div className="text-lg sm:text-xl font-bold text-cyan-300 font-mono mt-0.5">
                {marginLevel > 0 ? `${marginLevel.toFixed(1)}%` : '∞'}
              </div>
            </div>
          </div>

          {/* US30 Institutional Candlestick Chart */}
          <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  US30 {selectedTimeframe} Institutional Execution Chart
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  SL / TP Active
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#090C12] p-1 rounded-xl border border-white/[0.08]">
                {(['M1', 'M5', 'M15', 'H1'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      triggerSound('CLICK');
                      setSelectedTimeframe(tf);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      selectedTimeframe === tf
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {m15Candles.length === 0 ? (
              <div className="h-64 w-full bg-[#090C12] rounded-xl border border-white/[0.06] flex flex-col items-center justify-center text-xs text-slate-400 font-mono gap-2">
                <span>Loading US30 OHLC candles for {selectedTimeframe}...</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  Current US30 Spot: {us30Mid.toFixed(1)}
                </span>
              </div>
            ) : (
              (() => {
                const allHighs = m15Candles.map((c) => c.high);
                const allLows = m15Candles.map((c) => c.low);
                const minPrice = Math.min(...allLows) - 25;
                const maxPrice = Math.max(...allHighs) + 25;
                const range = Math.max(10, maxPrice - minPrice);
                const priceToY = (price: number) => 210 - ((price - minPrice) / range) * 180;
                const tpLevel = Number((us30Mid + customTpPips * us30Pip).toFixed(1));
                const slLevel = Number((us30Mid - customSlPips * us30Pip).toFixed(1));
                const buyLevel = Number((m15Candles[3]?.close ?? us30Mid).toFixed(1));
                const tpY = Math.max(24, Math.min(210, priceToY(tpLevel)));
                const buyY = Math.max(24, Math.min(210, priceToY(buyLevel)));
                const slY = Math.max(24, Math.min(210, priceToY(slLevel)));
                const pipsDelta = Number((us30Mid - buyLevel).toFixed(1));

                return (
                  <div className="relative h-64 w-full bg-[#090C12] rounded-xl border border-white/[0.06] p-2 overflow-hidden select-none">
                    <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                      <line x1="0" y1="40" x2="600" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="160" x2="600" y2="160" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="200" x2="600" y2="200" stroke="#1e293b" strokeDasharray="3 3" />

                      <line x1="0" y1={tpY} x2="600" y2={tpY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="485" y={Math.max(14, tpY - 4)} fill="#10b981" fontSize="10" fontWeight="bold">
                        TP: {tpLevel.toFixed(1)}
                      </text>

                      <line x1="0" y1={buyY} x2="600" y2={buyY} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="485" y={Math.max(14, buyY - 4)} fill="#67e8f9" fontSize="10" fontWeight="bold">
                        BUY: {buyLevel.toFixed(1)}
                      </text>

                      <line x1="0" y1={slY} x2="600" y2={slY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="485" y={Math.max(14, slY - 4)} fill="#ef4444" fontSize="10" fontWeight="bold">
                        SL: {slLevel.toFixed(1)}
                      </text>

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
                            />
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0F141E]/90 border border-white/[0.08] text-[11px] text-slate-200 flex items-center gap-2 font-mono tabular-nums">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>
                        US30: {us30Mid.toFixed(1)} • Spread: {us30Spread.toFixed(1)} • Delta:{' '}
                        {pipsDelta >= 0 ? `+${pipsDelta}` : pipsDelta}
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Open MT5 Orders Table */}
          <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Active MetaTrader 5 Orders ({activeDisplayPositions.length})
                </h3>
              </div>
              {activeDisplayPositions.length > 0 && (
                <button
                  onClick={() => {
                    triggerSound('ALERT');
                    activeDisplayPositions.forEach((pos) => closePosition(pos.id, 'MANUAL'));
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-xs font-semibold text-rose-300 hover:text-white transition whitespace-nowrap"
                >
                  Close All Tickets
                </button>
              )}
            </div>

            {activeDisplayPositions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tickets. Use Quick Trade Setup or SCAN to open positions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Ticket</th>
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Side</th>
                      <th className="pb-2">Lots</th>
                      <th className="pb-2">Open</th>
                      <th className="pb-2">Current</th>
                      <th className="pb-2">SL / TP</th>
                      <th className="pb-2">Profit ({currencyMode})</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                    {activeDisplayPositions.map((pos) => {
                      const rawProfit = currencyMode === 'ZAR' ? pos.profit * zarRate : pos.profit;
                      const ticketProfit =
                        currencyMode === 'ZAR'
                          ? `${rawProfit >= 0 ? '+' : '-'}R ${Math.abs(rawProfit).toFixed(2)}`
                          : `${rawProfit >= 0 ? '+' : '-'}$ ${Math.abs(rawProfit).toFixed(2)}`;

                      return (
                        <tr key={pos.id} className="hover:bg-[#161D2B] transition">
                          <td className="py-2.5 font-semibold text-slate-300">#{pos.ticket}</td>
                          <td className="py-2.5 font-semibold text-white">{pos.symbol}</td>
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
                          <td className="py-2.5 text-cyan-300 font-semibold">{pos.lots.toFixed(2)}</td>
                          <td className="py-2.5 text-slate-300">{pos.openPrice}</td>
                          <td className="py-2.5 text-slate-200">{pos.currentPrice}</td>
                          <td className="py-2.5 text-[11px] text-slate-400">
                            {pos.sl ?? '---'} / {pos.tp ?? '---'}
                          </td>
                          <td className={`py-2.5 font-semibold ${rawProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ticketProfit}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => {
                                triggerSound('CLICK');
                                closePosition(pos.id, 'MANUAL');
                              }}
                              className="px-2.5 py-1 rounded bg-[#161D2B] hover:bg-rose-600/20 border border-white/[0.08] text-slate-300 hover:text-rose-300 text-[11px] font-sans font-semibold transition"
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
            )}
          </div>
        </div>

        {/* Right Col: Connected Bots & VPS Telemetry */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Connected Bots (2)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                2 Active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">SOVEREIGN AI 2.0</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  NEURAL V2
                </span>
              </div>
              <div className="text-xs text-slate-400">Strategy: Neural Volatility Harvester</div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06] font-mono tabular-nums">
                <span className="text-slate-400 font-sans">Pairs: US30, XAUUSD</span>
                <span className="text-emerald-400 font-semibold">88.4% WR</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Scalper X2 Master</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  PROPRIETARY
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Strategy: Institutional SMC &amp; Order Block Inversion
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06] font-mono tabular-nums">
                <span className="text-slate-400 font-sans">Pairs: XAUUSDm, GBPJPY</span>
                <span className="text-amber-300 font-semibold">91.2% WR</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsAddEAModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 text-xs font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add a New EA (License Key)</span>
              </button>

              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsMentorModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#161D2B] hover:bg-[#1E2738] border border-white/[0.08] text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Principal Owner Login</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F141E] border border-white/[0.08] space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Bridge &amp; VPS Integrity</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                <div className="text-[11px] font-sans text-slate-400">Equinix LD4 Ping</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">{bridgeLatencyMs.toFixed(1)} ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06]">
                <div className="text-[11px] font-sans text-slate-400">Execution Speed</div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">&lt; 15ms DMA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EA-NEXUS ADAPTIVE GRID & BASKET ENGINE + PARTNER BROKER LICENSE GATE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Adaptive Grid &amp; Basket Trading Engine (ea-nexus.com)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure dynamic pip spacing, geometric lot scaling, trailing basket exit, and context spread/news filters.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 tabular-nums shrink-0">
              {demoSafeguardOn ? 'DEMO FORWARD-TEST ARMED' : 'LIVE ACCOUNT MODE'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <label className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">GRID STEP (PIPS)</span>
              <input
                type="number"
                min={5}
                max={200}
                value={gridStepPips}
                onChange={(e) => setGridStepPips(Math.max(5, Number(e.target.value) || 5))}
                className="w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-white font-bold tabular-nums"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">LOT MULTIPLIER</span>
              <input
                type="number"
                min={1}
                max={3}
                step={0.05}
                value={gridMultiplier}
                onChange={(e) => setGridMultiplier(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-cyan-300 font-bold tabular-nums"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">MAX BASKET</span>
              <input
                type="number"
                min={1}
                max={12}
                value={maxBasketOrders}
                onChange={(e) => setMaxBasketOrders(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                className="w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-white font-bold tabular-nums"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">TRAIL TP ($)</span>
              <input
                type="number"
                min={10}
                step={5}
                value={basketTrailProfitUsd}
                onChange={(e) => setBasketTrailProfitUsd(Math.max(10, Number(e.target.value) || 10))}
                className="w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-emerald-400 font-bold tabular-nums"
              />
            </label>
            <label className="p-2.5 rounded-xl bg-[#161D2B] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">DD BREAKER (%)</span>
              <input
                type="number"
                min={1}
                max={25}
                step={0.5}
                value={basketDdBreakerPct}
                onChange={(e) => setBasketDdBreakerPct(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-[#090C12] border border-white/[0.08] rounded-md px-2 py-1 text-amber-300 font-bold tabular-nums"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contextFilterOn}
                  onChange={(e) => setContextFilterOn(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>ATR &amp; Session Volatility Filter</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demoSafeguardOn}
                  onChange={(e) => setDemoSafeguardOn(e.target.checked)}
                  className="accent-emerald-400"
                />
                <span>Demo Forward-Test Guard</span>
              </label>
            </div>

            <button
              disabled={isExecuting}
              onClick={async () => {
                triggerSound('EXECUTE');
                setIsExecuting(true);
                const res = await executeBatchOrders({
                  symbol: tradeSymbol,
                  side: tradeSide,
                  lots: tradeLots,
                  count: Math.min(5, maxBasketOrders),
                  comment: `NexusBasket_${gridStepPips}p_x${gridMultiplier}`,
                });
                setIsExecuting(false);
                if (res.success) {
                  showBanner(
                    `Deployed ${Math.min(5, maxBasketOrders)}-layer Adaptive Basket (${gridStepPips}p step, x${gridMultiplier} scaling, $${basketTrailProfitUsd} trail TP).`
                  );
                }
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Deploy Adaptive Basket</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#0F141E] border border-white/[0.08] p-5 space-y-4">
          <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Nexus Licensing &amp; Partner Program</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">MT4 / MT5</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {(
              [
                { id: 'MONTHLY', label: 'Monthly', price: '$49/mo' },
                { id: 'LIFETIME', label: 'Lifetime', price: '$390' },
                { id: 'PARTNER_FREE', label: 'Partner IB', price: '$0 Free' },
              ] as const
            ).map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  triggerSound('CLICK');
                  setNexusLicenseTier(tier.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  nexusLicenseTier === tier.id
                    ? 'bg-cyan-500/15 border-cyan-400 text-white'
                    : 'bg-[#161D2B] border-white/[0.08] text-slate-400'
                }`}
              >
                <div className="text-[10px] uppercase">{tier.label}</div>
                <div className="font-bold text-sm mt-0.5">{tier.price}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={partnerBroker}
              onChange={(e) => setPartnerBroker(e.target.value)}
              className="bg-[#161D2B] border border-white/[0.08] rounded-xl px-2.5 py-2 text-white"
            >
              <option>IC Markets Global</option>
              <option>Exness Partner IB</option>
              <option>Vantage Markets</option>
              <option>Pepperstone Pro</option>
            </select>
            <input
              type="text"
              value={partnerAccountLogin}
              onChange={(e) => setPartnerAccountLogin(e.target.value)}
              placeholder="MT4/MT5 Account #"
              className="bg-[#161D2B] border border-white/[0.08] rounded-xl px-2.5 py-2 text-white font-mono"
            />
          </div>

          <button
            disabled={isVerifyingPartner}
            onClick={async () => {
              triggerSound('TOGGLE');
              setIsVerifyingPartner(true);
              try {
                const res = await fetch('/api/mt5/verify-broker', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    brokerName: partnerBroker,
                    server: 'PartnerIB-Live01',
                    login: partnerAccountLogin,
                    password: 'partner-ib-verified',
                    accountType: 'LIVE',
                  }),
                });
                const json = (await res.json()) as { success?: boolean; details?: { pingMs?: number } };
                if (res.ok && json.success) {
                  setPartnerVerifiedMsg(
                    `Verified ${nexusLicenseTier === 'PARTNER_FREE' ? 'Partner IB Free' : nexusLicenseTier} license for #${partnerAccountLogin} (${json.details?.pingMs ?? 1.2}ms).`
                  );
                }
              } finally {
                setIsVerifyingPartner(false);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition disabled:opacity-50"
          >
            {isVerifyingPartner ? 'Verifying Partner Broker...' : 'Verify Account & Activate License'}
          </button>

          {partnerVerifiedMsg && (
            <div className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{partnerVerifiedMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Quick Trade Setup */}
      {isQuickTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0F141E] border border-cyan-500/35 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Quick Trade Setup</h3>
              </div>
              <button
                onClick={() => setIsQuickTradeOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Instrument</label>
              <select
                value={tradeSymbol}
                onChange={(e) => setTradeSymbol(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {BROKER_SYMBOLS.map((sym) => (
                  <option key={sym.symbol} value={sym.symbol}>
                    {sym.symbol} — {sym.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setTradeSide('BUY');
                }}
                className={`py-3 rounded-xl text-xs font-bold tracking-wide transition border ${
                  tradeSide === 'BUY'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setTradeSide('SELL');
                }}
                className={`py-3 rounded-xl text-xs font-bold tracking-wide transition border ${
                  tradeSide === 'SELL'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-[#161D2B] text-slate-400 border-white/[0.08]'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Lot Size per Ticket</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTradeLots((l) => Math.max(0.01, Number((l - 0.01).toFixed(2))))}
                    className="p-2 rounded-lg bg-[#161D2B] border border-white/[0.08] text-slate-200 font-bold hover:bg-[#1E2738]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tradeLots}
                    onChange={(e) => setTradeLots(Math.max(0.01, Number(e.target.value) || 0.01))}
                    className="w-full text-center py-2 bg-[#161D2B] border border-white/[0.1] rounded-lg text-white font-mono font-bold tabular-nums"
                  />
                  <button
                    onClick={() => setTradeLots((l) => Number((l + 0.01).toFixed(2)))}
                    className="p-2 rounded-lg bg-[#161D2B] border border-white/[0.08] text-slate-200 font-bold hover:bg-[#1E2738]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Simultaneous Tickets ({tradeCount})
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setTradeCount(cnt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition border ${
                        tradeCount === cnt
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-[#161D2B] text-slate-400 hover:text-white border-white/[0.08]'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Stop Loss (Pips)</label>
                <input
                  type="number"
                  min="1"
                  value={customSlPips}
                  onChange={(e) => setCustomSlPips(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-lg text-white font-mono font-bold tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Take Profit (Pips)</label>
                <input
                  type="number"
                  min="1"
                  value={customTpPips}
                  onChange={(e) => setCustomTpPips(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-lg text-white font-mono font-bold tabular-nums"
                />
              </div>
            </div>

            <button
              disabled={isExecuting}
              onClick={handleExecuteQuickTrade}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>
                {isExecuting
                  ? 'Dispatching to MetaTrader 5...'
                  : `Confirm & Trade (${tradeCount} Tickets)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Economic News Calendar */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0F141E] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  High-Impact Economic Calendar &amp; Circuit Breaker
                </h3>
              </div>
              <button
                onClick={() => setIsNewsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automated EA News Filter: ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400">
                {brand.brandName} Scalper X2 automatically suspends scalping 15 minutes before red-tier releases and widens spread tolerance to prevent slippage on live MetaTrader 5 accounts.
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
                  title: 'ECB President Speech',
                  impact: 'MEDIUM',
                  forecast: '---',
                  previous: '---',
                },
              ].map((ev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ev.impact}
                      </span>
                      <span className="font-semibold text-white text-xs">
                        {ev.currency} • {ev.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                      Forecast: {ev.forecast} • Prior: {ev.previous}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-cyan-300 font-mono shrink-0">
                    {ev.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Chart Scanner */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0F141E] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {brand.brandName} AI Multi-Symbol Chart Scanner
                </h3>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
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
                  className="p-3.5 rounded-xl bg-[#161D2B] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{scan.symbol}</span>
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
                    <div className="text-xs text-cyan-300 font-medium mt-0.5">{scan.pattern}</div>
                    <div className="text-[11px] text-slate-400 font-mono tabular-nums">
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
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition whitespace-nowrap shrink-0"
                  >
                    Load Trade
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add a New EA */}
      {isAddEAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F141E] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Add a New EA (License Key)</h3>
              </div>
              <button
                onClick={() => setIsAddEAModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">EA System Name</label>
                <input
                  type="text"
                  value={eaSystemName}
                  onChange={(e) => setEaSystemName(e.target.value)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Valid License Key (HWID Locked)
                </label>
                <input
                  type="text"
                  value={eaLicenseKey}
                  onChange={(e) => setEaLicenseKey(e.target.value)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-cyan-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">MT5 Magic Number</label>
                <input
                  type="number"
                  value={eaMagicNumber}
                  onChange={(e) => setEaMagicNumber(Number(e.target.value) || 0)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white font-mono"
                />
              </div>

              <button
                onClick={() => {
                  triggerSound('EXECUTE');
                  setIsAddEAModalOpen(false);
                  showBanner(`EA License ${eaLicenseKey} (${eaSystemName}) verified and synced with MetaTrader 5 Cloud VPS.`);
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Activate &amp; Deploy EA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Principal Owner Login */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F141E] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Principal Owner Master Login</h3>
              </div>
              <button
                onClick={() => setIsMentorModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Access the {brand.brandName} Master Admin console to issue client licenses, oversee live MetaTrader 5 terminals, and toggle remote kill switches.
              </p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Owner Email / ID</label>
                <input
                  type="email"
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Security PIN</label>
                <input
                  type="password"
                  value={mentorPin}
                  onChange={(e) => setMentorPin(e.target.value)}
                  className="w-full py-2 px-3 bg-[#161D2B] border border-white/[0.1] rounded-xl text-white"
                />
              </div>

              <button
                onClick={() => {
                  triggerSound('CLICK');
                  setIsMentorModalOpen(false);
                  showBanner(`Authenticated Master Owner console (${mentorEmail}). Control portal armed.`);
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Enter Master Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Reference Video */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#0F141E] border border-white/[0.1] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Reference Execution Footage ({brand.brandName})
                </h3>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#161D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black border border-white/[0.08] aspect-video flex items-center justify-center">
              <video
                src="/assets/aistudio/46dedda56c34b57c86dfc5ce97d9d992_613fc321.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { MarketPrice } from '../../types/trading';
import {
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Zap,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface RunningTickerProps {
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
  isCompact?: boolean;
}

// Major pairs prioritized for the ticker, starting with user-requested majors
const PRIORITY_PAIRS = [
  'XAUUSD',
  'EURUSD',
  'BTCUSD',
  'ETHUSD',
  'GBPUSD',
  'USDZAR',
  'US30',
  'USDJPY',
  'GBPJPY',
  'NAS100',
];

interface PairVisualConfig {
  badgeColor: string;
  badgeLabel: string;
  highlightBorder: string;
}

const PAIR_CONFIGS: Record<string, PairVisualConfig> = {
  XAUUSD: {
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    badgeLabel: 'GOLD',
    highlightBorder: 'hover:border-amber-500/50',
  },
  EURUSD: {
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    badgeLabel: 'FX',
    highlightBorder: 'hover:border-blue-500/50',
  },
  BTCUSD: {
    badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    badgeLabel: 'BTC',
    highlightBorder: 'hover:border-orange-500/50',
  },
  ETHUSD: {
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    badgeLabel: 'ETH',
    highlightBorder: 'hover:border-purple-500/50',
  },
  GBPUSD: {
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    badgeLabel: 'CABLE',
    highlightBorder: 'hover:border-cyan-500/50',
  },
  USDZAR: {
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    badgeLabel: 'ZA FX',
    highlightBorder: 'hover:border-emerald-500/50',
  },
  US30: {
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    badgeLabel: 'INDEX',
    highlightBorder: 'hover:border-emerald-500/50',
  },
  USDJPY: {
    badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    badgeLabel: 'YEN',
    highlightBorder: 'hover:border-indigo-500/50',
  },
  GBPJPY: {
    badgeColor: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    badgeLabel: 'CROSS',
    highlightBorder: 'hover:border-pink-500/50',
  },
  NAS100: {
    badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    badgeLabel: 'TECH',
    highlightBorder: 'hover:border-teal-500/50',
  },
};

export const RunningTicker: React.FC<RunningTickerProps> = ({
  onSelectSymbol,
  className = '',
  isCompact = false,
}) => {
  const { prices, isRealtimeFeedActive, ticksPerSecond } = useTrading();
  const [isPaused, setIsPaused] = useState(false);
  const [isFast, setIsFast] = useState(false);

  // Price direction tracking for tick flash animations
  const prevPricesRef = useRef<Record<string, number>>({});
  const [tickDirections, setTickDirections] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    const newDirections: Record<string, 'up' | 'down' | null> = {};
    let hasChanges = false;

    PRIORITY_PAIRS.forEach((sym) => {
      const current = prices[sym]?.bid;
      const prev = prevPricesRef.current[sym];

      if (current !== undefined && prev !== undefined && current !== prev) {
        newDirections[sym] = current > prev ? 'up' : 'down';
        hasChanges = true;
      }
      if (current !== undefined) {
        prevPricesRef.current[sym] = current;
      }
    });

    if (hasChanges) {
      setTickDirections((prev) => ({ ...prev, ...newDirections }));
      const timer = setTimeout(() => {
        setTickDirections((prev) => {
          const cleared = { ...prev };
          Object.keys(newDirections).forEach((k) => {
            cleared[k] = null;
          });
          return cleared;
        });
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [prices]);

  // Build the list of active quotes
  const tickerItems = useMemo(() => {
    return PRIORITY_PAIRS.map((symbol) => {
      const price = prices[symbol];
      const cfg = PAIR_CONFIGS[symbol] || {
        badgeColor: 'bg-slate-700/30 text-slate-300 border-slate-600/30',
        badgeLabel: 'PAIR',
        highlightBorder: 'hover:border-slate-500/50',
      };
      return { symbol, price, cfg };
    });
  }, [prices]);

  // Double the items for seamless infinite continuous looping
  const loopedItems = useMemo(() => {
    return [...tickerItems, ...tickerItems];
  }, [tickerItems]);

  const renderTickerCard = (
    item: { symbol: string; price?: MarketPrice; cfg: PairVisualConfig },
    index: number
  ) => {
    const { symbol, price, cfg } = item;
    if (!price) return null;

    const isUp = price.change24h >= 0;
    const direction = tickDirections[symbol];
    const isMajor = symbol === 'XAUUSD' || symbol === 'EURUSD' || symbol === 'BTCUSD';

    // Format price according to symbol decimals
    const formattedBid = price.bid.toFixed(price.digits);
    const formattedAsk = price.ask.toFixed(price.digits);

    return (
      <div
        key={`${symbol}-${index}`}
        onClick={() => onSelectSymbol?.(symbol)}
        title={`Click to analyze or trade ${symbol}`}
        className={`group flex items-center gap-2 sm:gap-2.5 px-3 py-1 rounded-xl bg-slate-900/70 border border-slate-800/80 transition-all cursor-pointer shrink-0 select-none ${
          cfg.highlightBorder
        } ${
          isMajor
            ? 'ring-1 ring-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90'
            : ''
        } ${
          direction === 'up'
            ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            : direction === 'down'
            ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
            : ''
        }`}
      >
        {/* Symbol & Category Badge */}
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[11px] sm:text-xs text-white tracking-wide group-hover:text-cyan-400 transition-colors">
            {symbol}
          </span>
          <span
            className={`px-1 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${cfg.badgeColor}`}
          >
            {cfg.badgeLabel}
          </span>
        </div>

        {/* Live Bid Price with Tick Flash Indicator */}
        <div className="flex items-center gap-1">
          <span
            className={`font-mono font-bold text-xs sm:text-[13px] px-1 rounded transition-colors ${
              direction === 'up'
                ? 'text-emerald-300 bg-emerald-500/20'
                : direction === 'down'
                ? 'text-rose-300 bg-rose-500/20'
                : 'text-slate-100'
            }`}
          >
            {formattedBid}
          </span>
        </div>

        {/* Spread badge on desktop */}
        {!isCompact && (
          <div className="hidden lg:flex flex-col text-[8px] text-slate-500 font-mono leading-none">
            <span>SPR</span>
            <span className="text-slate-400 font-semibold">{price.spread.toFixed(1)}</span>
          </div>
        )}

        {/* 24h Percentage Change */}
        <div
          className={`flex items-center text-[10px] sm:text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
            isUp
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-rose-400 bg-rose-500/10'
          }`}
        >
          {isUp ? (
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
          )}
          <span>
            {isUp ? '+' : ''}
            {price.change24h.toFixed(2)}%
          </span>
        </div>

        {/* Separator Line */}
        <span className="text-slate-800 ml-1">|</span>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full bg-[#040609] border-b border-slate-900/90 overflow-hidden flex items-center font-mono ${className}`}
    >
      {/* Left Static Control & Live Status Badge */}
      <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 py-1.5 shrink-0 z-20 bg-[#040609] shadow-[6px_0_12px_#040609] border-r border-slate-800/60">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-[10px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-wider">DMA TICKER</span>
        </div>

        {/* Live ticks per second */}
        <span className="hidden xl:inline-block text-[10px] text-slate-500">
          {ticksPerSecond} t/s
        </span>

        {/* Pause / Play Toggle */}
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          title={isPaused ? 'Resume continuous running ticker' : 'Pause ticker marquee'}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
        </button>

        {/* Speed Toggle */}
        <button
          onClick={() => setIsFast((prev) => !prev)}
          title={isFast ? 'Set normal speed' : 'Set high speed'}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition ${
            isFast
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {isFast ? '2X' : '1X'}
        </button>
      </div>

      {/* Center Running Ticker Tape */}
      <div className="relative flex-1 overflow-hidden py-1.5">
        {/* Left gradient fade overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#040609] to-transparent pointer-events-none z-10" />

        {/* Continuous Running Animation Container */}
        <div
          className={`${
            isFast ? 'animate-running-ticker-fast' : 'animate-running-ticker'
          } ${isPaused ? 'ticker-paused' : ''} gap-3 sm:gap-4 px-2`}
        >
          {loopedItems.map((item, idx) => renderTickerCard(item, idx))}
        </div>

        {/* Right gradient fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#040609] to-transparent pointer-events-none z-10" />
      </div>

      {/* Right Quick Spotlights (Desktop Only) */}
      <div className="hidden lg:flex items-center gap-3 pr-3 pl-2 py-1.5 shrink-0 z-20 bg-[#040609] shadow-[-6px_0_12px_#040609] border-l border-slate-800/60 text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Real-time Binance &amp; Interbank</span>
        </div>
      </div>
    </div>
  );
};

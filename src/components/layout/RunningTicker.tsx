import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { MarketPrice } from '../../types/trading';
import {
  Pause,
  Play,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface RunningTickerProps {
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
  isCompact?: boolean;
}

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

const PAIR_LABELS: Record<string, string> = {
  XAUUSD: 'GOLD',
  EURUSD: 'FX',
  BTCUSD: 'BTC',
  ETHUSD: 'ETH',
  GBPUSD: 'CABLE',
  USDZAR: 'ZAR',
  US30: 'DOW',
  USDJPY: 'YEN',
  GBPJPY: 'CROSS',
  NAS100: 'NDX',
};

export const RunningTicker: React.FC<RunningTickerProps> = ({
  onSelectSymbol,
  className = '',
  isCompact = false,
}) => {
  const { prices, ticksPerSecond } = useTrading();
  const [isPaused, setIsPaused] = useState(false);
  const [isFast, setIsFast] = useState(false);

  const prevPricesRef = useRef<Record<string, number>>({});
  const [tickDirections, setTickDirections] = useState<
    Record<string, 'up' | 'down' | null>
  >({});

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
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [prices]);

  const tickerItems = useMemo(() => {
    return PRIORITY_PAIRS.map((symbol) => ({
      symbol,
      price: prices[symbol],
      category: PAIR_LABELS[symbol] || 'PAIR',
    }));
  }, [prices]);

  const loopedItems = useMemo(
    () => [...tickerItems, ...tickerItems],
    [tickerItems]
  );

  const renderTickerCard = (
    item: { symbol: string; price?: MarketPrice; category: string },
    index: number
  ) => {
    const { symbol, price, category } = item;
    if (!price) return null;

    const isUp = price.change24h >= 0;
    const direction = tickDirections[symbol];
    const formattedBid = price.bid.toFixed(price.digits);

    return (
      <button
        key={`${symbol}-${index}`}
        type="button"
        onClick={() => onSelectSymbol?.(symbol)}
        title={`Open ${symbol} in Omni-Bridge`}
        className={`group flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#090C12] border transition cursor-pointer shrink-0 select-none ${
          direction === 'up'
            ? 'border-emerald-500/50'
            : direction === 'down'
            ? 'border-rose-500/50'
            : 'border-white/[0.06] hover:border-cyan-500/40'
        }`}
      >
        <span className="font-semibold text-[11px] text-white tracking-wide group-hover:text-cyan-400 transition-colors">
          {symbol}
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {category}
        </span>

        <span
          className={`font-mono font-semibold text-xs tabular-nums transition-colors ${
            direction === 'up'
              ? 'text-emerald-300'
              : direction === 'down'
              ? 'text-rose-300'
              : 'text-slate-100'
          }`}
        >
          {formattedBid}
        </span>

        {!isCompact && (
          <span className="hidden lg:inline text-[10px] text-slate-500 font-mono tabular-nums">
            {price.spread.toFixed(1)}
          </span>
        )}

        <span
          className={`flex items-center text-[10px] font-semibold font-mono tabular-nums ${
            isUp ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isUp ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {isUp ? '+' : ''}
          {price.change24h.toFixed(2)}%
        </span>
      </button>
    );
  };

  return (
    <div
      className={`relative w-full bg-[#06080D] border-b border-white/[0.06] overflow-hidden flex items-center font-mono ${className}`}
    >
      {/* Left Control Cap */}
      <div className="hidden sm:flex items-center gap-2 pl-3 pr-2.5 py-1 shrink-0 z-20 bg-[#06080D] border-r border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          <span className="tracking-wider">FEED</span>
        </div>

        <span className="hidden xl:inline-block text-[10px] text-slate-500 tabular-nums">
          {ticksPerSecond} t/s
        </span>

        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          title={isPaused ? 'Resume quote tape' : 'Pause quote tape'}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#0F141E] transition"
        >
          {isPaused ? (
            <Play className="w-3 h-3 text-emerald-400" />
          ) : (
            <Pause className="w-3 h-3" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsFast((prev) => !prev)}
          title={isFast ? 'Normal tape speed' : 'Fast tape speed'}
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
            isFast
              ? 'bg-cyan-500/15 text-cyan-300'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {isFast ? '2X' : '1X'}
        </button>
      </div>

      {/* Scrolling Quote Tape */}
      <div className="relative flex-1 overflow-hidden py-1">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#06080D] to-transparent pointer-events-none z-10" />

        <div
          className={`${
            isFast ? 'animate-running-ticker-fast' : 'animate-running-ticker'
          } ${isPaused ? 'ticker-paused' : ''} gap-2 px-2`}
        >
          {loopedItems.map((item, idx) => renderTickerCard(item, idx))}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#06080D] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

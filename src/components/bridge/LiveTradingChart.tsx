import React, { useState, useMemo, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { liveMarketData } from '../../services/liveMarketData';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldAlert,
  Crosshair,
} from 'lucide-react';

interface LiveTradingChartProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  onQuickTrade: (symbol: string, side: 'BUY' | 'SELL') => void;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const LiveTradingChart: React.FC<LiveTradingChartProps> = ({
  selectedSymbol,
  onSymbolChange,
  onQuickTrade,
}) => {
  const { prices, positions, ticksPerSecond, executeOrder, closePosition } = useTrading();
  const [timeframe, setTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D'>('5M');
  const [chartMode, setChartMode] = useState<'CANDLE' | 'LINE' | 'DEPTH'>('CANDLE');
  const [scalpLot, setScalpLot] = useState<number>(1.0);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionToast, setExecutionToast] = useState<string | null>(null);

  const currentPriceObj = prices[selectedSymbol] || prices['XAUUSD'];
  const activePositionsOnSymbol = positions.filter((p) => p.symbol === selectedSymbol);

  const [rawCandles, setRawCandles] = useState<Candle[]>([]);
  const [candleSource, setCandleSource] = useState<string>('Connecting...');

  useEffect(() => {
    let active = true;
    const loadCandles = async () => {
      const { candles: fetched, source } = await liveMarketData.fetchCandles(selectedSymbol, timeframe);
      if (!active) return;
      if (fetched.length > 0) {
        const digits = prices[selectedSymbol]?.digits ?? 2;
        const formatted: Candle[] = fetched.slice(-42).map((bar) => ({
          time: new Date(bar.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: Number(bar.open.toFixed(digits)),
          high: Number(bar.high.toFixed(digits)),
          low: Number(bar.low.toFixed(digits)),
          close: Number(bar.close.toFixed(digits)),
          volume: Math.max(1, Math.round(bar.volume || 1)),
        }));
        setRawCandles(formatted);
        setCandleSource(source);
      }
    };
    void loadCandles();
    const timer = setInterval(() => void loadCandles(), 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedSymbol, timeframe, prices]);

  // Merge live real-time bid tick into active candle
  const candles = useMemo(() => {
    if (!currentPriceObj) return rawCandles;
    if (rawCandles.length === 0) {
      const p = currentPriceObj.bid;
      return [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: p,
          high: p,
          low: p,
          close: p,
          volume: Math.max(1, ticksPerSecond),
        },
      ];
    }
    const copy = [...rawCandles];
    const last = { ...copy[copy.length - 1] };
    last.close = currentPriceObj.bid;
    last.high = Number(Math.max(last.high, currentPriceObj.bid).toFixed(currentPriceObj.digits));
    last.low = Number(Math.min(last.low, currentPriceObj.bid).toFixed(currentPriceObj.digits));
    copy[copy.length - 1] = last;
    return copy;
  }, [rawCandles, currentPriceObj, ticksPerSecond]);

  const minPrice = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : 0;
  const maxPrice = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : 1;
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...candles.map((c) => c.volume), 10);

  // Level 2 DOM ladder anchored to live market spread
  const orderBookBids = useMemo(() => {
    if (!currentPriceObj) return [];
    return [
      { price: currentPriceObj.bid, size: 4.8, total: 4.8, pct: 40 },
      { price: Number((currentPriceObj.bid - currentPriceObj.pipSize * 2).toFixed(currentPriceObj.digits)), size: 8.5, total: 13.3, pct: 65 },
      { price: Number((currentPriceObj.bid - currentPriceObj.pipSize * 5).toFixed(currentPriceObj.digits)), size: 14.2, total: 27.5, pct: 85 },
      { price: Number((currentPriceObj.bid - currentPriceObj.pipSize * 8).toFixed(currentPriceObj.digits)), size: 21.0, total: 48.5, pct: 95 },
      { price: Number((currentPriceObj.bid - currentPriceObj.pipSize * 12).toFixed(currentPriceObj.digits)), size: 35.4, total: 83.9, pct: 100 },
    ];
  }, [currentPriceObj]);

  const orderBookAsks = useMemo(() => {
    if (!currentPriceObj) return [];
    return [
      { price: currentPriceObj.ask, size: 3.9, total: 3.9, pct: 35 },
      { price: Number((currentPriceObj.ask + currentPriceObj.pipSize * 2).toFixed(currentPriceObj.digits)), size: 7.2, total: 11.1, pct: 55 },
      { price: Number((currentPriceObj.ask + currentPriceObj.pipSize * 5).toFixed(currentPriceObj.digits)), size: 12.8, total: 23.9, pct: 75 },
      { price: Number((currentPriceObj.ask + currentPriceObj.pipSize * 8).toFixed(currentPriceObj.digits)), size: 18.6, total: 42.5, pct: 90 },
      { price: Number((currentPriceObj.ask + currentPriceObj.pipSize * 12).toFixed(currentPriceObj.digits)), size: 29.1, total: 71.6, pct: 100 },
    ];
  }, [currentPriceObj]);

  // Instant Scalp Order Execution
  const handleInstantScalp = async (side: 'BUY' | 'SELL') => {
    setIsExecuting(true);
    try {
      const res = await executeOrder({
        symbol: selectedSymbol,
        orderType: 'MARKET',
        side,
        lots: scalpLot,
        comment: `ScalpDeck-${side}`,
      });
      setExecutionToast(`${side} ${scalpLot}L executed @ ${side === 'BUY' ? currentPriceObj?.ask : currentPriceObj?.bid}`);
      setTimeout(() => setExecutionToast(null), 3500);
    } catch {
      onQuickTrade(selectedSymbol, side);
    } finally {
      setIsExecuting(false);
    }
  };

  // Flatten all open positions on current symbol
  const handleFlattenSymbol = () => {
    if (activePositionsOnSymbol.length === 0) return;
    activePositionsOnSymbol.forEach((pos) => {
      closePosition(pos.id, 'MANUAL');
    });
    setExecutionToast(`Flattened ${activePositionsOnSymbol.length} positions on ${selectedSymbol}`);
    setTimeout(() => setExecutionToast(null), 3500);
  };

  const activeCandle = hoveredCandle || candles[candles.length - 1];

  return (
    <div className="obsidian-panel hud-bracket rounded-2xl overflow-hidden font-mono text-xs relative">
      {/* Chart Top Controls Bar */}
      <div className="p-3 sm:p-4 border-b border-white/[0.08] bg-black/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
        {/* Symbol Selector & Live Quote Tag */}
        <div className="flex items-center justify-between sm:justify-start gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar shrink-0">
            {Object.keys(prices).slice(0, 6).map((sym) => (
              <button
                key={sym}
                onClick={() => onSymbolChange(sym)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap min-h-[32px] ${
                  selectedSymbol === sym
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-100">
              {currentPriceObj?.bid}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                currentPriceObj && currentPriceObj.change24h >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {currentPriceObj && currentPriceObj.change24h >= 0 ? '+' : ''}
              {currentPriceObj?.change24h}%
            </span>
          </div>
        </div>

        {/* Timeframe & Chart Style */}
        <div className="flex items-center gap-2">
          {/* Real-time Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{candleSource} ({ticksPerSecond} TPS)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/[0.08]">
            {(['1M', '5M', '15M', '1H', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  timeframe === tf ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setChartMode('CANDLE')}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                chartMode === 'CANDLE' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartMode('LINE')}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                chartMode === 'LINE' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartMode('DEPTH')}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                chartMode === 'DEPTH' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Order Book
            </button>
          </div>
        </div>
      </div>

      {/* Floating Active Candle Telemetry Bar */}
      {activeCandle && chartMode !== 'DEPTH' && (
        <div className="px-4 py-1.5 bg-slate-950/60 border-b border-white/[0.05] flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>TIME: <strong className="text-slate-300">{activeCandle.time}</strong></span>
          </span>
          <span>O: <strong className="text-slate-200">{activeCandle.open}</strong></span>
          <span>H: <strong className="text-emerald-400">{activeCandle.high}</strong></span>
          <span>L: <strong className="text-rose-400">{activeCandle.low}</strong></span>
          <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{activeCandle.close}</strong></span>
          <span>VOL: <strong className="text-amber-400">{activeCandle.volume.toLocaleString()}</strong></span>
          {executionToast && (
            <span className="ml-auto text-emerald-400 font-bold animate-pulse">
              {executionToast}
            </span>
          )}
        </div>
      )}

      {/* Main Chart Canvas Area */}
      <div className="p-4 relative h-[330px] flex items-center justify-between">
        {chartMode !== 'DEPTH' ? (
          <div className="w-full h-full relative">
            <svg
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoveredCandle(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={240 * ratio}
                  x2="100%"
                  y2={240 * ratio}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
              ))}

              {/* Volume Separator Baseline */}
              <line
                x1="0"
                y1="250"
                x2="100%"
                y2="250"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <text x="8" y="246" fill="#64748b" fontSize="9" fontWeight="bold">
                VOL HISTOGRAM
              </text>

              {/* Volume Bars at the bottom */}
              {candles.map((candle, idx) => {
                const width = 100 / candles.length;
                const x = (idx / candles.length) * 100 + width / 4;
                const isGreen = candle.close >= candle.open;
                const volHeight = Math.max(3, (candle.volume / maxVolume) * 60);

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={`${x}%`}
                    y={310 - volHeight}
                    width={`${width * 0.55}%`}
                    height={volHeight}
                    fill={isGreen ? '#10b981' : '#f43f5e'}
                    opacity={hoveredCandle === candle ? 0.9 : 0.35}
                    rx="1"
                  />
                );
              })}

              {/* Candlesticks Rendering */}
              {chartMode === 'CANDLE' &&
                candles.map((candle, idx) => {
                  const width = 100 / candles.length;
                  const x = (idx / candles.length) * 100 + width / 4;
                  const isGreen = candle.close >= candle.open;

                  const yHigh = ((maxPrice - candle.high) / priceRange) * 210 + 20;
                  const yLow = ((maxPrice - candle.low) / priceRange) * 210 + 20;
                  const yOpen = ((maxPrice - candle.open) / priceRange) * 210 + 20;
                  const yClose = ((maxPrice - candle.close) / priceRange) * 210 + 20;

                  const bodyTop = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                  return (
                    <g
                      key={`candle-${idx}`}
                      onMouseEnter={() => setHoveredCandle(candle)}
                      className="cursor-crosshair"
                    >
                      {/* Transparent hit area for easy hovering */}
                      <rect
                        x={`${(idx / candles.length) * 100}%`}
                        y="0"
                        width={`${width}%`}
                        height="320"
                        fill="transparent"
                      />
                      {/* Wick */}
                      <line
                        x1={`${x + width * 0.275}%`}
                        y1={yHigh}
                        x2={`${x + width * 0.275}%`}
                        y2={yLow}
                        stroke={isGreen ? '#10b981' : '#f43f5e'}
                        strokeWidth="1.2"
                      />
                      {/* Body */}
                      <rect
                        x={`${x}%`}
                        y={bodyTop}
                        width={`${width * 0.55}%`}
                        height={bodyHeight}
                        fill={isGreen ? '#10b981' : '#f43f5e'}
                        stroke={isGreen ? '#34d399' : '#fb7185'}
                        strokeWidth="0.5"
                        rx="1"
                      />
                    </g>
                  );
                })}

              {/* Line Mode Rendering */}
              {chartMode === 'LINE' && (
                <path
                  d={candles
                    .map((c, i) => {
                      const x = (i / (candles.length - 1)) * 960;
                      const y = ((maxPrice - c.close) / priceRange) * 210 + 20;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
              )}

              {/* Current Market Price Laser Line */}
              {currentPriceObj && (
                <g>
                  <line
                    x1="0"
                    y1={((maxPrice - currentPriceObj.bid) / priceRange) * 210 + 20}
                    x2="100%"
                    y2={((maxPrice - currentPriceObj.bid) / priceRange) * 210 + 20}
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <rect
                    x="88%"
                    y={((maxPrice - currentPriceObj.bid) / priceRange) * 210 + 10}
                    width="70"
                    height="20"
                    fill="#06b6d4"
                    rx="4"
                  />
                  <text
                    x="89%"
                    y={((maxPrice - currentPriceObj.bid) / priceRange) * 210 + 24}
                    fill="#020617"
                    fontSize="10"
                    fontWeight="900"
                  >
                    {currentPriceObj.bid}
                  </text>
                </g>
              )}
            </svg>

            {/* Active Position Markers on the chart */}
            {activePositionsOnSymbol.map((pos) => {
              const yPos = ((maxPrice - pos.openPrice) / priceRange) * 210 + 20;
              return (
                <div
                  key={pos.id}
                  className="absolute left-4 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 z-10 border shadow-md backdrop-blur-md"
                  style={{
                    top: `${Math.max(10, Math.min(230, yPos))}px`,
                    backgroundColor: pos.side === 'BUY' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)',
                    borderColor: pos.side === 'BUY' ? '#10b981' : '#f43f5e',
                    color: pos.side === 'BUY' ? '#10b981' : '#f43f5e',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  <span>#{pos.ticket} {pos.side} {pos.lots}L @ {pos.openPrice}</span>
                  <span className="ml-1 text-slate-200">({pos.pips >= 0 ? '+' : ''}{pos.pips}p)</span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Level 2 Depth of Market (Order Book) */
          <div className="w-full grid grid-cols-2 gap-4 h-full">
            {/* Bids Column */}
            <div className="space-y-1.5 p-3.5 bg-slate-950/70 rounded-xl border border-white/[0.08]">
              <div className="flex justify-between text-[11px] font-black text-emerald-400 border-b border-white/[0.08] pb-1.5">
                <span>BID (BUYERS)</span>
                <span>LOTS</span>
                <span>DEPTH</span>
              </div>
              {orderBookBids.map((b, i) => (
                <div key={i} className="relative flex justify-between text-xs font-mono py-1 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/10 pointer-events-none rounded"
                    style={{ width: `${b.pct}%` }}
                  />
                  <span className="text-emerald-400 font-bold z-10">{b.price}</span>
                  <span className="text-slate-200 font-semibold z-10">{b.size}L</span>
                  <span className="text-slate-500 z-10">{b.total}</span>
                </div>
              ))}
            </div>

            {/* Asks Column */}
            <div className="space-y-1.5 p-3.5 bg-slate-950/70 rounded-xl border border-white/[0.08]">
              <div className="flex justify-between text-[11px] font-black text-rose-400 border-b border-white/[0.08] pb-1.5">
                <span>ASK (SELLERS)</span>
                <span>LOTS</span>
                <span>DEPTH</span>
              </div>
              {orderBookAsks.map((a, i) => (
                <div key={i} className="relative flex justify-between text-xs font-mono py-1 overflow-hidden">
                  <div
                    className="absolute inset-y-0 right-0 bg-rose-500/10 pointer-events-none rounded"
                    style={{ width: `${a.pct}%` }}
                  />
                  <span className="text-rose-400 font-bold z-10">{a.price}</span>
                  <span className="text-slate-200 font-semibold z-10">{a.size}L</span>
                  <span className="text-slate-500 z-10">{a.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Execution & Lot Scalp Bar */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-black/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Scalp Lot Presets */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Lot Preset:</span>
          </span>
          {[0.05, 0.10, 0.50, 1.00, 2.50, 5.00].map((val) => (
            <button
              key={val}
              onClick={() => setScalpLot(val)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                scalpLot === val
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/[0.05]'
              }`}
            >
              {val.toFixed(2)}L
            </button>
          ))}
        </div>

        {/* Right: Flatten Symbol Button & Direct 1-Click Buy/Sell */}
        <div className="flex items-center gap-2 ml-auto">
          {activePositionsOnSymbol.length > 0 && (
            <button
              onClick={handleFlattenSymbol}
              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs transition flex items-center gap-1"
              title={`Close all ${activePositionsOnSymbol.length} positions on ${selectedSymbol}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Flatten ({activePositionsOnSymbol.length})</span>
            </button>
          )}

          <button
            onClick={() => handleInstantScalp('SELL')}
            disabled={isExecuting}
            className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-950/40 disabled:opacity-50"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>SELL {scalpLot}L @ {currentPriceObj?.bid}</span>
          </button>

          <button
            onClick={() => handleInstantScalp('BUY')}
            disabled={isExecuting}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 disabled:opacity-50"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>BUY {scalpLot}L @ {currentPriceObj?.ask}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

